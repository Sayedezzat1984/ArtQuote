// Powered by OnSpace.AI
// Reusable image upload component with Cloudinary integration and progress tracking
import React, { useState, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, ActivityIndicator,
  ScrollView, Alert, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';
import {
  uploadImageToCloudinary, isCloudinaryUrl, getThumbnailUrl,
  CloudinaryUploadResult, UploadProgress,
} from '@/services/cloudinaryService';

export interface UploadedImage {
  uri: string;           // Display URI (Cloudinary secure_url OR local URI if pending)
  secure_url?: string;   // Cloudinary URL (set after successful upload)
  public_id?: string;    // Cloudinary public_id for future server-side deletion
  isUploading?: boolean;
  uploadError?: string;
  uploadProgress?: number;
}

interface CloudImagePickerProps {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  folder?: string;
  readOnly?: boolean;
  label?: string;
}

export function CloudImagePicker({
  images,
  onChange,
  maxImages = 10,
  folder = 'sayed_ezzat/artworks',
  readOnly = false,
  label,
}: CloudImagePickerProps) {
  const [uploadingIndexes, setUploadingIndexes] = useState<Set<number>>(new Set());

  const uploadSingleImage = useCallback(async (localUri: string, index: number, currentImages: UploadedImage[]) => {
    setUploadingIndexes(prev => new Set([...prev, index]));

    // Mark as uploading
    const withUploading = [...currentImages];
    withUploading[index] = { ...withUploading[index], isUploading: true, uploadError: undefined, uploadProgress: 0 };
    onChange(withUploading);

    try {
      const result = await uploadImageToCloudinary(
        localUri,
        folder,
        (progress: UploadProgress) => {
          // Update progress
          onChange(prev => {
            const updated = [...prev];
            if (updated[index]) {
              updated[index] = { ...updated[index], uploadProgress: progress.percentage };
            }
            return updated;
          });
        },
      );

      // Update with Cloudinary data
      onChange(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index] = {
            uri: result.secure_url,
            secure_url: result.secure_url,
            public_id: result.public_id,
            isUploading: false,
            uploadProgress: 100,
          };
        }
        return updated;
      });
    } catch (err: any) {
      onChange(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index] = {
            ...updated[index],
            isUploading: false,
            uploadError: err?.message || 'فشل الرفع',
            uploadProgress: undefined,
          };
        }
        return updated;
      });
    } finally {
      setUploadingIndexes(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  }, [folder, onChange]);

  async function pickImages() {
    if (readOnly) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('خطأ', 'نحتاج إذن الوصول للصور');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: maxImages - images.length,
    });
    if (result.canceled || !result.assets) return;

    const startIndex = images.length;
    const newImages: UploadedImage[] = result.assets.map(a => ({ uri: a.uri }));
    const combined = [...images, ...newImages].slice(0, maxImages);
    onChange(combined);

    // Upload each new image
    for (let i = 0; i < newImages.length; i++) {
      const idx = startIndex + i;
      if (idx < maxImages) {
        uploadSingleImage(newImages[i].uri, idx, combined);
      }
    }
  }

  async function takePhoto() {
    if (readOnly) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('خطأ', 'نحتاج إذن الكاميرا');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;

    const idx = images.length;
    const newImg: UploadedImage = { uri: result.assets[0].uri };
    const combined = [...images, newImg].slice(0, maxImages);
    onChange(combined);
    uploadSingleImage(newImg.uri, idx, combined);
  }

  function removeImage(index: number) {
    if (readOnly) return;
    onChange(images.filter((_, i) => i !== index));
  }

  function moveLeft(index: number) {
    if (index === 0) return;
    const updated = [...images];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  }

  function moveRight(index: number) {
    if (index >= images.length - 1) return;
    const updated = [...images];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
  }

  function retryUpload(index: number) {
    const img = images[index];
    if (img && !isCloudinaryUrl(img.uri)) {
      uploadSingleImage(img.uri, index, images);
    }
  }

  const anyUploading = images.some(img => img.isUploading);
  const uploadedCount = images.filter(img => img.secure_url || isCloudinaryUrl(img.uri)).length;

  return (
    <View>
      <View style={s.headerRow}>
        <View style={s.statusRow}>
          {anyUploading ? (
            <View style={s.syncBadge}>
              <ActivityIndicator size={10} color={Colors.primary} />
              <Text style={s.syncTxt}>جارٍ الرفع...</Text>
            </View>
          ) : uploadedCount > 0 ? (
            <View style={[s.syncBadge, s.syncDone]}>
              <MaterialIcons name="cloud-done" size={12} color={Colors.success} />
              <Text style={[s.syncTxt, { color: Colors.success }]}>{uploadedCount}/{images.length} مرفوعة</Text>
            </View>
          ) : null}
        </View>
        <Text style={s.label}>{label || `الصور (${images.length}/${maxImages})`}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.scroll}>
        <View style={s.row}>
          {!readOnly ? (
            <>
              <Pressable onPress={pickImages} disabled={images.length >= maxImages} style={[s.addBtn, images.length >= maxImages && s.addBtnDisabled]}>
                <MaterialIcons name="add-photo-alternate" size={26} color={Colors.primary} />
                <Text style={s.addBtnTxt}>معرض</Text>
              </Pressable>
              <Pressable onPress={takePhoto} disabled={images.length >= maxImages} style={[s.addBtn, images.length >= maxImages && s.addBtnDisabled]}>
                <MaterialIcons name="camera-alt" size={26} color={Colors.info} />
                <Text style={[s.addBtnTxt, { color: Colors.info }]}>كاميرا</Text>
              </Pressable>
            </>
          ) : null}

          {images.map((img, i) => (
            <View key={`${img.uri}-${i}`} style={s.imgWrap}>
              <Image
                source={{ uri: img.secure_url ? getThumbnailUrl(img.secure_url) : img.uri }}
                style={s.img}
                contentFit="cover"
                transition={200}
              />

              {/* Main badge */}
              {i === 0 ? (
                <View style={s.mainBadge}>
                  <Text style={s.mainBadgeTxt}>رئيسية</Text>
                </View>
              ) : null}

              {/* Upload overlay */}
              {img.isUploading ? (
                <View style={s.uploadOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={s.overlayTxt}>{img.uploadProgress || 0}%</Text>
                </View>
              ) : img.uploadError ? (
                <Pressable onPress={() => retryUpload(i)} style={[s.uploadOverlay, s.errorOverlay]}>
                  <MaterialIcons name="refresh" size={18} color="#fff" />
                  <Text style={s.overlayTxt}>إعادة</Text>
                </Pressable>
              ) : img.secure_url ? (
                <View style={s.cloudBadge}>
                  <MaterialIcons name="cloud-done" size={10} color={Colors.success} />
                </View>
              ) : null}

              {/* Controls */}
              {!readOnly ? (
                <>
                  <View style={s.reorderRow}>
                    {i > 0 ? (
                      <Pressable onPress={() => moveLeft(i)} style={s.arrowBtn} hitSlop={4}>
                        <MaterialIcons name="chevron-right" size={13} color="#fff" />
                      </Pressable>
                    ) : <View style={s.arrowPlaceholder} />}
                    {i < images.length - 1 ? (
                      <Pressable onPress={() => moveRight(i)} style={s.arrowBtn} hitSlop={4}>
                        <MaterialIcons name="chevron-left" size={13} color="#fff" />
                      </Pressable>
                    ) : <View style={s.arrowPlaceholder} />}
                  </View>
                  <Pressable onPress={() => removeImage(i)} style={s.removeBtn} hitSlop={4}>
                    <MaterialIcons name="close" size={12} color="#fff" />
                  </Pressable>
                </>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>

      {images.some(img => img.uploadError) ? (
        <View style={s.errorHint}>
          <MaterialIcons name="warning" size={13} color={Colors.warning} />
          <Text style={s.errorHintTxt}>بعض الصور لم تُرفع — اضغط عليها للمحاولة مجدداً</Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Convert legacy string[] of URIs to UploadedImage[] for use with CloudImagePicker.
 */
export function toUploadedImages(uris: string[]): UploadedImage[] {
  return uris.map(uri => ({
    uri,
    secure_url: isCloudinaryUrl(uri) ? uri : undefined,
    public_id: undefined,
  }));
}

/**
 * Extract final display URIs from UploadedImage[] (prefer secure_url over local URI).
 */
export function toUriArray(images: UploadedImage[]): string[] {
  return images.map(img => img.secure_url || img.uri).filter(Boolean);
}

const s = StyleSheet.create({
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary, textAlign: 'right' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primarySurface, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: Colors.primary + '40' },
  syncDone: { backgroundColor: Colors.successSurface, borderColor: Colors.success + '40' },
  syncTxt: { fontSize: 10, color: Colors.primary, fontWeight: FontWeight.medium },
  scroll: { marginBottom: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: 2, alignItems: 'center' },
  addBtn: { width: 80, height: 90, borderRadius: Radius.md, backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  addBtnDisabled: { opacity: 0.4 },
  addBtnTxt: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  imgWrap: { width: 90, height: 90, borderRadius: Radius.md, overflow: 'hidden', position: 'relative' },
  img: { width: '100%', height: '100%' },
  mainBadge: { position: 'absolute', bottom: 18, left: 0, right: 0, backgroundColor: Colors.primary + 'DD', paddingVertical: 2, alignItems: 'center' },
  mainBadgeTxt: { fontSize: 9, color: Colors.textOnPrimary, fontWeight: FontWeight.bold },
  uploadOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', gap: 3 },
  errorOverlay: { backgroundColor: 'rgba(232,106,106,0.75)' },
  overlayTxt: { fontSize: 10, color: '#fff', fontWeight: FontWeight.bold },
  cloudBadge: { position: 'absolute', top: 4, left: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  reorderRow: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 2, paddingVertical: 2 },
  arrowBtn: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  arrowPlaceholder: { width: 20 },
  removeBtn: { position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  errorHint: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 },
  errorHintTxt: { fontSize: 10, color: Colors.warning },
});
