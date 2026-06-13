import { View, Image, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, fontSize, fontWeight } from '../utils/theme';
import { getInitials } from '../utils/formatters';

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
  '2xl': 128,
};

const fontSizeMap = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 22,
  xl: 28,
  '2xl': 42,
};

const Avatar = ({ uri, name, size = 'md', style = null }) => {
  const dimension = sizeMap[size] || sizeMap.md;
  const fs = fontSizeMap[size] || fontSizeMap.md;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          {
            width: dimension,
            height: dimension,
            borderRadius: dimension / 2,
          },
          style,
        ]}
      />
    );
  }

  return (
    <LinearGradient
      colors={[colors.primary[400], colors.primary[600]]}
      style={[
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text style={{ color: '#fff', fontSize: fs, fontWeight: fontWeight.semibold }}>
        {getInitials(name)}
      </Text>
    </LinearGradient>
  );
};

export default Avatar;
