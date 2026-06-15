import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { getPostById } from '../services/firestore';
import { colors, spacing, radius, fontSize, fontWeight } from '../utils/theme';

export default function SharedPostPreview({ postId, isMine }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const data = await getPostById(postId);
        setPost(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (postId) fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={isMine ? '#fff' : colors.primary[500]} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.errorText, isMine && styles.textMine]}>Post not found</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.container, isMine && styles.containerMine]} 
      onPress={() => router.push(`/post/${postId}`)}
      activeOpacity={0.8}
    >
      {post.imageURLs && post.imageURLs.length > 0 && (
        <Image source={{ uri: post.imageURLs[0] }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.details}>
        <Text style={[styles.author, isMine && styles.textMine]}>{post.authorName}</Text>
        {post.caption ? (
          <Text style={[styles.caption, isMine && styles.textMine]}>
            {post.caption.slice(0, 50)}{post.caption.length > 50 ? '...' : ''}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    padding: spacing[3],
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontStyle: 'italic',
    fontSize: fontSize.xs,
    color: colors.neutral[500],
  },
  container: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  containerMine: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: colors.neutral[100],
  },
  details: {
    padding: spacing[2],
  },
  author: {
    fontWeight: fontWeight.bold,
    fontSize: fontSize.xs,
    color: colors.neutral[900],
  },
  caption: {
    fontSize: fontSize.xs,
    color: colors.neutral[600],
    marginTop: 2,
  },
  textMine: {
    color: '#fff',
  },
});
