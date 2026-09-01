// Powered by OnSpace.AI
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, Modal, StyleSheet, Pressable, Dimensions,
  ScrollView, Alert, ActivityIndicator, PanResponder, Animated,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');

interface ImageViewerModalProps {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
  onImagesChanged?: (newImages: string[]) => void;
}

type EditMode = null | 'crop' | 'rotate';

export function ImageViewerModal({ visible, images, initialIndex = 0, onClose, onImagesChanged }: ImageViewerModalProps) {
  const [activeIdx, setActiveIdx] = useState(initialIndex);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [saving, setSaving] = useState(false);
  const [cropBox, setCropBox] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const [dragging, setDragging] = useState<'tl' | 'tr' | 'bl' | 'br' | 'move' | null>(null);
  const dragStart = useRef({ x: 0, y: 0, box: cropBox });

  // Zoom & pan state
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastScale = useRef(1);
  const lastTX = useRef(0);
  const lastTY = useRef(0);
  const lastTap = useRef(0);

  const resetTransform = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
    lastScale.current = 1;
    lastTX.current = 0;
    lastTY.current = 0;
  }, [scale, translateX, translateY]);

  const pinchRef = useRef({ dist: 0, active: false });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => editMode === null,
    onMoveShouldSetPanResponder: () => editMode === null,
    onPanResponderGrant: (e) => {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        // Double tap — toggle zoom
        if (lastScale.current > 1.05) {
          resetTransform();
        } else {
          Animated.spring(scale, { toValue: 2.5, useNativeDriver: true }).start();
          lastScale.current = 2.5;
        }
        lastTap.current = 0;
        return;
      }
      lastTap.current = now;
      const touches = e.nativeEvent.touches;
      if (touches.length === 2) {
        const dx = touches[0].pageX - touches[1].pageX;
        const dy = touches[0].pageY - touches[1].pageY;
        pinchRef.current = { dist: Math.sqrt(dx * dx + dy * dy), active: true };
      }
    },
    onPanResponderMove: (e, gs) => {
      const touches = e.nativeEvent.touches;
      if (touches.length === 2 && pinchRef.current.active) {
        const dx = touches[0].pageX - touches[1].pageX;
        const dy = touches[0].pageY - touches[1].pageY;
        const newDist = Math.sqrt(dx * dx + dy * dy);
        const ratio = newDist / pinchRef.current.dist;
        const newScale = Math.max(0.8, Math.min(5, lastScale.current * ratio));
        scale.setValue(newScale);
      } else if (touches.length === 1 && lastScale.current > 1.05) {
        translateX.setValue(lastTX.current + gs.dx);
        translateY.setValue(lastTY.current + gs.dy);
      }
    },
    onPanResponderRelease: (e, gs) => {
      if (pinchRef.current.active) {
        lastScale.current = (scale as any)._value;
        pinchRef.current.active = false;
      } else if (lastScale.current > 1.05) {
        lastTX.current += gs.dx;
        lastTY.current += gs.dy;
      } else {
        // Swipe to change image
        if (gs.dx < -60 && activeIdx < images.length - 1) {
          setActiveIdx(i => i + 1);
          resetTransform();
        } else if (gs.dx > 60 && activeIdx > 0) {
          setActiveIdx(i => i - 1);
          resetTransform();
        }
      }
    },
  });

  // ─── Crop Drag ───
  const IMG_W = SW;
  const IMG_H = SH * 0.65;

  function toPx(box: typeof cropBox) {
    return {
      left: box.x * IMG_W,
      top: box.y * IMG_H,
      w: box.w * IMG_W,
      h: box.h * IMG_H,
    };
  }

  const cropPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => editMode === 'crop',
    onMoveShouldSetPanResponder: () => editMode === 'crop',
    onPanResponderGrant: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      const px = toPx(cropBox);
      const HANDLE = 30;
      const corners: Array<{ name: typeof dragging; cx: number; cy: number }> = [
        { name: 'tl', cx: px.left, cy: px.top },
        { name: 'tr', cx: px.left + px.w, cy: px.top },
        { name: 'bl', cx: px.left, cy: px.top + px.h },
        { name: 'br', cx: px.left + px.w, cy: px.top + px.h },
      ];
      let hit: typeof dragging = null;
      for (const c of corners) {
        if (Math.abs(locationX - c.cx) < HANDLE && Math.abs(locationY - c.cy) < HANDLE) {
          hit = c.name;
          break;
        }
      }
      if (!hit) {
        // Check if inside box = move
        if (locationX > px.left && locationX < px.left + px.w &&
            locationY > px.top && locationY < px.top + px.h) {
          hit = 'move';
        }
      }
      setDragging(hit);
      dragStart.current = { x: locationX, y: locationY, box: { ...cropBox } };
    },
    onPanResponderMove: (_, gs) => {
      if (!dragging) return;
      const dx = gs.dx / IMG_W;
      const dy = gs.dy / IMG_H;
      const b = dragStart.current.box;
      const MIN = 0.05;
      let nb = { ...b };
      if (dragging === 'move') {
        const nx = Math.max(0, Math.min(1 - b.w, b.x + dx));
        const ny = Math.max(0, Math.min(1 - b.h, b.y + dy));
        nb = { ...b, x: nx, y: ny };
      } else if (dragging === 'tl') {
        const nx = Math.max(0, Math.min(b.x + b.w - MIN, b.x + dx));
        const ny = Math.max(0, Math.min(b.y + b.h - MIN, b.y + dy));
        nb = { x: nx, y: ny, w: b.w + (b.x - nx), h: b.h + (b.y - ny) };
      } else if (dragging === 'tr') {
        const ny = Math.max(0, Math.min(b.y + b.h - MIN, b.y + dy));
        const nw = Math.max(MIN, Math.min(1 - b.x, b.w + dx));
        nb = { x: b.x, y: ny, w: nw, h: b.h + (b.y - ny) };
      } else if (dragging === 'bl') {
        const nx = Math.max(0, Math.min(b.x + b.w - MIN, b.x + dx));
        const nh = Math.max(MIN, Math.min(1 - b.y, b.h + dy));
        nb = { x: nx, y: b.y, w: b.w + (b.x - nx), h: nh };
      } else if (dragging === 'br') {
        const nw = Math.max(MIN, Math.min(1 - b.x, b.w + dx));
        const nh = Math.max(MIN, Math.min(1 - b.y, b.h + dy));
        nb = { ...b, w: nw, h: nh };
      }
      setCropBox(nb);
    },
    onPanResponderRelease: () => setDragging(null),
  });

  async function applyCrop() {
    if (!images[activeIdx]) return;
    setSaving(true);
    try {
      const result = await ImageManipulator.manipulateAsync(
        images[activeIdx],
        [{
          crop: {
            originX: Math.round(cropBox.x * 1000),
            originY: Math.round(cropBox.y * 1000),
            width: Math.round(cropBox.w * 1000),
            height: Math.round(cropBox.h * 1000),
          },
        }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      const newImages = [...images];
      newImages[activeIdx] = result.uri;
      onImagesChanged?.(newImages);
      setEditMode(null);
      setCropBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
    } catch {
      Alert.alert('خطأ', 'فشل في قص الصورة');
    } finally {
      setSaving(false);
    }
  }

  async function applyRotate(degrees: number) {
    if (!images[activeIdx]) return;
    setSaving(true);
    try {
      const result = await ImageManipulator.manipulateAsync(
        images[activeIdx],
        [{ rotate: degrees }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      const newImages = [...images];
      newImages[activeIdx] = result.uri;
      onImagesChanged?.(newImages);
    } catch {
      Alert.alert('خطأ', 'فشل في تدوير الصورة');
    } finally {
      setSaving(false);
    }
  }

  async function applyFlip(axis: 'horizontal' | 'vertical') {
    if (!images[activeIdx]) return;
    setSaving(true);
    try {
      const result = await ImageManipulator.manipulateAsync(
        images[activeIdx],
        [{ flip: axis === 'horizontal' ? ImageManipulator.FlipType.Horizontal : ImageManipulator.FlipType.Vertical }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      const newImages = [...images];
      newImages[activeIdx] = result.uri;
      onImagesChanged?.(newImages);
    } catch {
      Alert.alert('خطأ', 'فشل في قلب الصورة');
    } finally {
      setSaving(false);
    }
  }

  async function saveToGallery() {
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') { Alert.alert('تنبيه', 'نحتاج إذن الوصول للصور'); return; }
      await MediaLibrary.saveToLibraryAsync(images[activeIdx]);
      Alert.alert('تم', 'تم حفظ الصورة في الاستوديو');
    } catch {
      Alert.alert('خطأ', 'فشل في حفظ الصورة');
    } finally {
      setSaving(false);
    }
  }

  async function shareImage() {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(images[activeIdx]);
    }
  }

  const px = toPx(cropBox);
  const currentImg = images[activeIdx];

  return (
    <Modal visible={visible} transparent={false} animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>

        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={styles.topRight}>
            {editMode ? (
              <>
                <Pressable onPress={() => { setEditMode(null); setCropBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 }); }} style={styles.topBtn}>
                  <MaterialIcons name="close" size={20} color="#fff" />
                  <Text style={styles.topBtnText}>إلغاء</Text>
                </Pressable>
                {editMode === 'crop' ? (
                  <Pressable onPress={applyCrop} disabled={saving} style={[styles.topBtn, styles.applyBtn]}>
                    {saving ? <ActivityIndicator size="small" color="#fff" /> : <MaterialIcons name="check" size={20} color="#fff" />}
                    <Text style={styles.topBtnText}>تطبيق القص</Text>
                  </Pressable>
                ) : null}
              </>
            ) : (
              <>
                <Pressable onPress={saveToGallery} disabled={saving} style={styles.topBtn}>
                  <MaterialIcons name="save-alt" size={20} color="#fff" />
                </Pressable>
                <Pressable onPress={shareImage} style={styles.topBtn}>
                  <MaterialIcons name="share" size={20} color="#fff" />
                </Pressable>
              </>
            )}
          </View>

          <View style={styles.topLeft}>
            {images.length > 1 ? (
              <Text style={styles.counterText}>{activeIdx + 1} / {images.length}</Text>
            ) : null}
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="arrow-back" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Main Image Area */}
        <View style={styles.imageArea}>
          {editMode === 'crop' ? (
            // Crop mode — static image with crop overlay
            <View style={[styles.cropContainer, { width: IMG_W, height: IMG_H }]} {...cropPanResponder.panHandlers}>
              <Image source={{ uri: currentImg }} style={{ width: IMG_W, height: IMG_H }} contentFit="contain" />

              {/* Dark overlay outside crop */}
              <View style={[styles.cropOverlay, { top: 0, left: 0, right: 0, height: px.top }]} />
              <View style={[styles.cropOverlay, { top: px.top + px.h, left: 0, right: 0, bottom: 0 }]} />
              <View style={[styles.cropOverlay, { top: px.top, left: 0, width: px.left, height: px.h }]} />
              <View style={[styles.cropOverlay, { top: px.top, left: px.left + px.w, right: 0, height: px.h }]} />

              {/* Crop box border */}
              <View style={[styles.cropBox, { left: px.left, top: px.top, width: px.w, height: px.h }]}>
                {/* Grid lines */}
                <View style={[styles.gridLine, styles.gridH, { top: px.h / 3 }]} />
                <View style={[styles.gridLine, styles.gridH, { top: (px.h * 2) / 3 }]} />
                <View style={[styles.gridLine, styles.gridV, { left: px.w / 3 }]} />
                <View style={[styles.gridLine, styles.gridV, { left: (px.w * 2) / 3 }]} />
                {/* Handles */}
                <View style={[styles.handle, styles.handleTL]} />
                <View style={[styles.handle, styles.handleTR]} />
                <View style={[styles.handle, styles.handleBL]} />
                <View style={[styles.handle, styles.handleBR]} />
              </View>
              <Text style={styles.cropHint}>اسحب الزوايا أو المنطقة للتعديل</Text>
            </View>
          ) : (
            // Normal view with zoom/pan
            <Animated.View
              style={[styles.imageWrap, { transform: [{ scale }, { translateX }, { translateY }] }]}
              {...panResponder.panHandlers}
            >
              <Image
                source={{ uri: currentImg }}
                style={{ width: SW, height: SH * 0.72 }}
                contentFit="contain"
                transition={150}
              />
            </Animated.View>
          )}
        </View>

        {/* Rotate & Flip toolbar (visible only in rotate mode or always) */}
        {editMode === 'rotate' ? (
          <View style={styles.rotateBar}>
            <Pressable onPress={() => { setEditMode(null); }} style={styles.rotBarBtn}>
              <MaterialIcons name="check" size={22} color={Colors.primary} />
              <Text style={styles.rotBarLabel}>تم</Text>
            </Pressable>
            <Pressable onPress={() => applyFlip('vertical')} disabled={saving} style={styles.rotBarBtn}>
              <MaterialIcons name="flip" size={22} color="#fff" style={{ transform: [{ rotate: '90deg' }] }} />
              <Text style={styles.rotBarLabel}>قلب أفقي</Text>
            </Pressable>
            <Pressable onPress={() => applyFlip('horizontal')} disabled={saving} style={styles.rotBarBtn}>
              <MaterialIcons name="flip" size={22} color="#fff" />
              <Text style={styles.rotBarLabel}>قلب رأسي</Text>
            </Pressable>
            <Pressable onPress={() => applyRotate(-90)} disabled={saving} style={styles.rotBarBtn}>
              <MaterialIcons name="rotate-left" size={22} color="#fff" />
              <Text style={styles.rotBarLabel}>-90°</Text>
            </Pressable>
            <Pressable onPress={() => applyRotate(90)} disabled={saving} style={styles.rotBarBtn}>
              <MaterialIcons name="rotate-right" size={22} color="#fff" />
              <Text style={styles.rotBarLabel}>+90°</Text>
            </Pressable>
            {saving ? <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} /> : null}
          </View>
        ) : null}

        {/* Bottom Toolbar */}
        {!editMode ? (
          <View style={styles.bottomBar}>
            {/* Thumbnails row if multiple */}
            {images.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbsRow} contentContainerStyle={styles.thumbsContent}>
                {images.map((uri, i) => (
                  <Pressable key={i} onPress={() => { setActiveIdx(i); resetTransform(); }}
                    style={[styles.thumbWrap, i === activeIdx && styles.thumbWrapActive]}>
                    <Image source={{ uri }} style={styles.thumbImg} contentFit="cover" />
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            {/* Edit Actions */}
            <View style={styles.editActionsRow}>
              <Pressable onPress={() => { resetTransform(); setEditMode('rotate'); }} style={styles.editActionBtn}>
                <MaterialIcons name="rotate-right" size={24} color="#fff" />
                <Text style={styles.editActionLabel}>تدوير</Text>
              </Pressable>
              <Pressable onPress={() => { resetTransform(); setCropBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 }); setEditMode('crop'); }} style={styles.editActionBtn}>
                <MaterialIcons name="crop" size={24} color="#fff" />
                <Text style={styles.editActionLabel}>قص</Text>
              </Pressable>
              <Pressable onPress={resetTransform} style={styles.editActionBtn}>
                <MaterialIcons name="zoom-out-map" size={24} color="#fff" />
                <Text style={styles.editActionLabel}>إعادة ضبط</Text>
              </Pressable>
              <View style={styles.zoomHint}>
                <MaterialIcons name="pinch" size={18} color="rgba(255,255,255,0.4)" />
                <Text style={styles.zoomHintText}>ابضغط مرتين للتكبير</Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 50, paddingHorizontal: Spacing.base, paddingBottom: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 10,
  },
  topRight: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  topLeft: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  topBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
  },
  applyBtn: { backgroundColor: Colors.primary + 'CC' },
  topBtnText: { fontSize: FontSize.sm, color: '#fff', fontWeight: FontWeight.semibold },
  counterText: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', fontWeight: FontWeight.medium },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },

  imageArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  imageWrap: { alignItems: 'center', justifyContent: 'center' },

  // Crop
  cropContainer: { position: 'relative', overflow: 'hidden' },
  cropOverlay: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.55)' },
  cropBox: {
    position: 'absolute', borderWidth: 1.5, borderColor: '#fff',
    overflow: 'hidden',
  },
  gridLine: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.3)' },
  gridH: { left: 0, right: 0, height: 1 },
  gridV: { top: 0, bottom: 0, width: 1 },
  handle: {
    position: 'absolute', width: 22, height: 22,
    borderColor: Colors.primary, borderWidth: 3,
    backgroundColor: '#fff',
  },
  handleTL: { top: -4, left: -4, borderRightWidth: 0, borderBottomWidth: 0 },
  handleTR: { top: -4, right: -4, borderLeftWidth: 0, borderBottomWidth: 0 },
  handleBL: { bottom: -4, left: -4, borderRightWidth: 0, borderTopWidth: 0 },
  handleBR: { bottom: -4, right: -4, borderLeftWidth: 0, borderTopWidth: 0 },
  cropHint: {
    position: 'absolute', bottom: 10, alignSelf: 'center',
    fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full,
  },

  // Rotate bar
  rotateBar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)', paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  rotBarBtn: { alignItems: 'center', gap: 4, paddingHorizontal: Spacing.sm },
  rotBarLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)' },

  // Bottom bar
  bottomBar: {
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 24,
  },
  thumbsRow: { maxHeight: 76, paddingTop: Spacing.sm },
  thumbsContent: { paddingHorizontal: Spacing.base, gap: Spacing.sm, alignItems: 'center' },
  thumbWrap: {
    width: 58, height: 58, borderRadius: Radius.sm, overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbWrapActive: { borderColor: Colors.primary },
  thumbImg: { width: '100%', height: '100%' },

  editActionsRow: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.base,
  },
  editActionBtn: { alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, minWidth: 60 },
  editActionLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.85)', fontWeight: FontWeight.medium },
  zoomHint: { alignItems: 'center', gap: 3 },
  zoomHintText: { fontSize: 9, color: 'rgba(255,255,255,0.35)', textAlign: 'center' },
});
