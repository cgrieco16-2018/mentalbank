import React, { useState, useEffect, useRef, Component, ReactNode } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "./ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

let Canvas: any = null;
let Path: any = null;
let Skia: any = null;
let skiaAvailable = false;

try {
  const skiaModule = require("@shopify/react-native-skia");
  Canvas = skiaModule.Canvas;
  Path = skiaModule.Path;
  Skia = skiaModule.Skia;
  skiaAvailable = Platform.OS !== "web";
} catch (e) {
  skiaAvailable = false;
}

class SkiaErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

interface DrawingPath {
  path: string;
  color: string;
  width: number;
}

interface DrawingCanvasProps {
  initialPaths?: DrawingPath[];
  onSave: (paths: DrawingPath[]) => void;
  height?: number;
}

const CANVAS_BACKGROUND = "#FFFFFF";

const DRAWING_COLORS = [
  { name: "Black", value: "#000000", icon: null },
  { name: "Blue", value: "#0066CC", icon: null },
  { name: "Red", value: "#CC0000", icon: null },
];

const ERASER_COLOR = CANVAS_BACKGROUND;
const ERASER_WIDTH = 20;

export function DrawingCanvas({
  initialPaths = [],
  onSave,
  height = 300,
}: DrawingCanvasProps) {
  const { theme: colors } = useTheme();
  const [paths, setPaths] = useState<DrawingPath[]>(initialPaths);
  const [currentPathSvg, setCurrentPathSvg] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(DRAWING_COLORS[0].value);
  const [isEraser, setIsEraser] = useState(false);
  const [hasError, setHasError] = useState(false);
  const currentPathRef = useRef<any>(null);
  const pathsRef = useRef<DrawingPath[]>(paths);

  useEffect(() => {
    setPaths(initialPaths);
    pathsRef.current = initialPaths;
  }, [initialPaths]);

  const getActiveColor = () => isEraser ? ERASER_COLOR : selectedColor;
  const getActiveWidth = () => isEraser ? ERASER_WIDTH : 3;

  const startPath = (x: number, y: number) => {
    if (skiaAvailable && Skia && !hasError) {
      try {
        const path = Skia.Path.Make();
        path.moveTo(x, y);
        currentPathRef.current = path;
        setCurrentPathSvg(path.toSVGString());
      } catch (e) {
        console.error("Drawing error:", e);
        setHasError(true);
      }
    }
  };

  const updatePath = (x: number, y: number) => {
    if (skiaAvailable && Skia && currentPathRef.current && !hasError) {
      try {
        currentPathRef.current.lineTo(x, y);
        setCurrentPathSvg(currentPathRef.current.toSVGString());
      } catch (e) {
        console.error("Drawing error:", e);
        setHasError(true);
      }
    }
  };

  const endPath = () => {
    if (currentPathRef.current) {
      const newPath: DrawingPath = {
        path: currentPathRef.current.toSVGString(),
        color: getActiveColor(),
        width: getActiveWidth(),
      };
      const newPaths = [...pathsRef.current, newPath];
      pathsRef.current = newPaths;
      setPaths(newPaths);
      setCurrentPathSvg(null);
      currentPathRef.current = null;
      onSave(newPaths);
    }
  };

  const handleClear = () => {
    setPaths([]);
    pathsRef.current = [];
    setCurrentPathSvg(null);
    currentPathRef.current = null;
    onSave([]);
  };

  const handleUndo = () => {
    if (paths.length > 0) {
      const newPaths = paths.slice(0, -1);
      setPaths(newPaths);
      pathsRef.current = newPaths;
      onSave(newPaths);
    }
  };

  const selectColor = (color: string) => {
    setSelectedColor(color);
    setIsEraser(false);
  };

  const selectEraser = () => {
    setIsEraser(true);
  };

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(1)
    .onStart((event) => {
      startPath(event.x, event.y);
    })
    .onUpdate((event) => {
      updatePath(event.x, event.y);
    })
    .onEnd(() => {
      endPath();
    });

  const renderCanvas = () => {
    if (!skiaAvailable || hasError || Platform.OS === "web") {
      return (
        <View style={[styles.webFallback, { backgroundColor: CANVAS_BACKGROUND }]}>
          <Feather
            name="edit-3"
            size={48}
            color="#999999"
            style={{ opacity: 0.3 }}
          />
          <ThemedText
            style={[styles.webFallbackText, { color: "#666666" }]}
          >
            {hasError
              ? "Sketching isn't available on this device. Try on iOS or Android with any stylus or your finger, or use the Type tab."
              : "Sketching works on iOS and Android with any stylus or your finger. Use the Type tab on web."}
          </ThemedText>
        </View>
      );
    }

    return (
      <SkiaErrorBoundary onError={() => setHasError(true)}>
        <GestureDetector gesture={panGesture}>
          <Canvas style={{ flex: 1, backgroundColor: CANVAS_BACKGROUND }}>
            {paths.map((pathData, index) => {
              const skiaPath = Skia?.Path?.MakeFromSVGString?.(pathData.path);
              return skiaPath ? (
                <Path
                  key={index}
                  path={skiaPath}
                  color={pathData.color}
                  style="stroke"
                  strokeWidth={pathData.width}
                  strokeCap="round"
                  strokeJoin="round"
                />
              ) : null;
            })}
            {currentPathSvg ? (() => {
              const skiaCurrentPath = Skia?.Path?.MakeFromSVGString?.(currentPathSvg);
              return skiaCurrentPath ? (
                <Path
                  path={skiaCurrentPath}
                  color={getActiveColor()}
                  style="stroke"
                  strokeWidth={getActiveWidth()}
                  strokeCap="round"
                  strokeJoin="round"
                />
              ) : null;
            })() : null}
          </Canvas>
        </GestureDetector>
      </SkiaErrorBoundary>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.colorPalette}>
          {DRAWING_COLORS.map((color) => (
            <Pressable
              key={color.value}
              style={[
                styles.colorButton,
                {
                  backgroundColor: color.value,
                  borderWidth: !isEraser && selectedColor === color.value ? 3 : 1,
                  borderColor:
                    !isEraser && selectedColor === color.value
                      ? colors.primary
                      : colors.backgroundTertiary,
                },
              ]}
              onPress={() => selectColor(color.value)}
            />
          ))}
          
          <Pressable
            style={[
              styles.eraserButton,
              {
                backgroundColor: colors.backgroundSecondary,
                borderWidth: isEraser ? 3 : 1,
                borderColor: isEraser ? colors.primary : colors.backgroundTertiary,
              },
            ]}
            onPress={selectEraser}
          >
            <Feather 
              name="minus-circle" 
              size={20} 
              color={isEraser ? colors.primary : colors.text} 
            />
          </Pressable>
        </View>

        <View style={styles.toolButtons}>
          <Pressable
            style={[
              styles.toolButton,
              { backgroundColor: colors.backgroundSecondary },
            ]}
            onPress={handleUndo}
          >
            <Feather name="corner-up-left" size={20} color={colors.text} />
          </Pressable>

          <Pressable
            style={[
              styles.toolButton,
              { backgroundColor: colors.backgroundSecondary },
            ]}
            onPress={handleClear}
          >
            <Feather name="trash-2" size={20} color={colors.danger} />
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.canvasContainer,
          {
            height,
            backgroundColor: CANVAS_BACKGROUND,
            borderColor: colors.backgroundTertiary,
          },
        ]}
      >
        {renderCanvas()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  colorPalette: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center",
  },
  colorButton: {
    width: Spacing.minTouchTarget,
    height: Spacing.minTouchTarget,
    borderRadius: Spacing.minTouchTarget / 2,
  },
  eraserButton: {
    width: Spacing.minTouchTarget,
    height: Spacing.minTouchTarget,
    borderRadius: Spacing.minTouchTarget / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  toolButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  toolButton: {
    width: Spacing.minTouchTarget,
    height: Spacing.minTouchTarget,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  canvasContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  webFallbackText: {
    textAlign: "center",
    maxWidth: 200,
  },
});
