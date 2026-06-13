import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, ImageIcon, MapPin, X } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { createPost } from '../../services/firestore';
import { uploadPostImages } from '../../services/storage';
import { colors, spacing, radius, fontSize, fontWeight, MAX_CAPTION_LENGTH, MAX_IMAGES_PER_POST } from '../../utils/theme';

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const { user, userProfile } = useAuth();
  const toast = useToast();

  const [images, setImages] = useState([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [speciesTag, setSpeciesTag] = useState('');
  const [uploading, setUploading] = useState(false);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES_PER_POST - images.length,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES_PER_POST));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) {
      setImages((prev) => [...prev, result.assets[0].uri].slice(0, MAX_IMAGES_PER_POST));
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      toast.warning('Add at least one photo');
      return;
    }

    setUploading(true);
    try {
      const imageURLs = await uploadPostImages(user.uid, images);
      await createPost({
        authorId: user.uid,
        authorName: userProfile?.displayName || user.displayName || 'Explorer',
        authorUsername: userProfile?.username || '',
        authorPhotoURL: userProfile?.photoURL || user.photoURL || null,
        imageURLs,
        caption: caption.trim(),
        location: location.trim(),
        speciesTag: speciesTag.trim(),
      });
      toast.success('Shared to the wild! 🌿');
      router.replace('/(tabs)');
    } catch (err) {
      console.error(err);
      toast.error(`Error: ${err.message || 'Failed to create post'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={colors.neutral[900]} strokeWidth={1.75} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Field Note</Text>
        <TouchableOpacity
          style={[styles.shareBtn, (uploading || images.length === 0) && styles.shareBtnDisabled]}
          onPress={handleSubmit}
          disabled={uploading || images.length === 0}
        >
          <Text style={styles.shareBtnText}>{uploading ? '...' : 'Share'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Upload Area */}
        {images.length === 0 ? (
          <View style={styles.uploadArea}>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImages} activeOpacity={0.7}>
              <ImageIcon size={40} color={colors.neutral[300]} strokeWidth={1.5} />
              <Text style={styles.uploadText}>Add nature photographs</Text>
              <Text style={styles.uploadHint}>Gallery • Up to {MAX_IMAGES_PER_POST} images</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cameraBtn} onPress={takePhoto} activeOpacity={0.8}>
              <Text style={styles.cameraBtnText}>📷 Take a Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView horizontal style={styles.previews} showsHorizontalScrollIndicator={false}>
            {images.map((uri, i) => (
              <View key={i} style={styles.previewItem}>
                <Image source={{ uri }} style={styles.previewImage} />
                <TouchableOpacity style={styles.previewRemove} onPress={() => removeImage(i)}>
                  <X size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {images.length < MAX_IMAGES_PER_POST && (
              <TouchableOpacity style={styles.addMore} onPress={pickImages}>
                <ImageIcon size={24} color={colors.neutral[300]} strokeWidth={1.5} />
              </TouchableOpacity>
            )}
          </ScrollView>
        )}

        {/* Caption */}
        <View style={styles.field}>
          <TextInput
            style={styles.captionInput}
            placeholder="What did you observe in the wild today?"
            placeholderTextColor={colors.neutral[400]}
            value={caption}
            onChangeText={setCaption}
            maxLength={MAX_CAPTION_LENGTH}
            multiline
            numberOfLines={4}
          />
          <Text style={styles.charCount}>{caption.length}/{MAX_CAPTION_LENGTH}</Text>
        </View>

        {/* Location */}
        <View style={styles.fieldRow}>
          <MapPin size={18} color={colors.neutral[400]} strokeWidth={1.75} />
          <TextInput
            style={styles.fieldInput}
            placeholder="Add location (e.g., Yellowstone, WY)"
            placeholderTextColor={colors.neutral[400]}
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Species */}
        <View style={styles.fieldRow}>
          <Text style={{ fontSize: 18 }}>🌱</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="Tag a species (e.g., Great Blue Heron)"
            placeholderTextColor={colors.neutral[400]}
            value={speciesTag}
            onChangeText={setSpeciesTag}
          />
        </View>
      </ScrollView>

      {/* Upload Overlay */}
      {uploading && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <ActivityIndicator size="large" color={colors.primary[500]} />
            <Text style={styles.overlayText}>Sharing to the wild...</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.neutral[50] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[150],
  },
  headerTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.neutral[900] },
  shareBtn: { backgroundColor: colors.primary[500], paddingHorizontal: spacing[5], paddingVertical: spacing[2], borderRadius: radius.full },
  shareBtnDisabled: { opacity: 0.4 },
  shareBtnText: { color: '#fff', fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  content: { padding: spacing[4], gap: spacing[5] },
  uploadArea: { gap: spacing[3] },
  uploadBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    paddingVertical: spacing[16],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.neutral[200],
    borderRadius: radius.xl,
    backgroundColor: colors.neutral[100],
  },
  uploadText: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.neutral[600] },
  uploadHint: { fontSize: fontSize.xs, color: colors.neutral[400] },
  cameraBtn: {
    backgroundColor: colors.neutral[0],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  cameraBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.neutral[700] },
  previews: { flexDirection: 'row', gap: spacing[3] },
  previewItem: { width: 120, height: 120, borderRadius: radius.lg, overflow: 'hidden', marginRight: spacing[3] },
  previewImage: { width: '100%', height: '100%' },
  previewRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMore: {
    width: 120,
    height: 120,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { position: 'relative' },
  captionInput: {
    backgroundColor: colors.neutral[0],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[6],
    fontSize: fontSize.base,
    color: colors.neutral[900],
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: { position: 'absolute', bottom: spacing[2], right: spacing[3], fontSize: fontSize.xs, color: colors.neutral[400] },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.neutral[0],
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  fieldInput: { flex: 1, fontSize: fontSize.base, color: colors.neutral[900] },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing[10],
    alignItems: 'center',
    gap: spacing[4],
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  overlayText: { fontSize: fontSize.sm, color: colors.neutral[600], fontWeight: fontWeight.medium },
});
