/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  sage_green_light: {
    text: '#2e3d34',              
    background: '#f3f6f4',        
    tint:'rgb(135, 147, 113)',              
    icon: '#7c8b75',             
    tabIconDefault: '#A0AD99',   
    tabIconSelected: '#A3B18A',  
  },
  pastel_pink: {
    text: '#3A2C33',              
    background: '#FFEFF5',        
    // tint: '#FF7BA9',      
    tint:'rgb(244, 114, 159)',        
    icon: '#A67C8E',              
    tabIconDefault: '#C9A2B3',    
    tabIconSelected: '#FF7BA9',  
  },
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
