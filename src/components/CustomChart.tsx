import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, Platform } from 'react-native';
import Svg, { Path, Circle, Rect, G, Line, LinearGradient, Stop, Defs, Text as SvgText } from 'react-native-svg';
import { THEME } from '../constants/theme';

interface ChartLineData {
  label: string;
  values: number[]; // Numbers between minY and maxY
  color: string;
}

interface CustomChartProps {
  type: 'line' | 'bar';
  labels: string[]; // X axis labels (e.g. Mon, Tue, etc.)
  datasets: ChartLineData[];
  height?: number;
  minY?: number;
  maxY?: number;
  ySuffix?: string;
}

export const CustomChart: React.FC<CustomChartProps> = ({
  type,
  labels,
  datasets,
  height = 200,
  minY = 0,
  maxY = 100,
  ySuffix = '',
}) => {
  const [selectedPoint, setSelectedPoint] = useState<{
    datasetIndex: number;
    valueIndex: number;
    value: number;
    label: string;
    x: number;
    y: number;
  } | null>(null);

  const [containerWidth, setContainerWidth] = useState(
    Platform.OS === 'web' ? 500 : Dimensions.get('window').width - 32
  );

  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 25;
  const paddingBottom = 30;

  const chartWidth = containerWidth - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates
  const getCoordinates = (value: number, index: number, totalPoints: number) => {
    const x = paddingLeft + (totalPoints > 1 ? (index / (totalPoints - 1)) * chartWidth : chartWidth / 2);
    // Avoid division by zero
    const yRange = maxY - minY || 1;
    const clampedValue = Math.max(minY, Math.min(maxY, value));
    const y = height - paddingBottom - ((clampedValue - minY) / yRange) * chartHeight;
    return { x, y };
  };

  const onLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) {
      setContainerWidth(width);
    }
  };

  // Render grid lines (horizontal Y axis markers)
  const renderGridLines = () => {
    const lines = 4;
    const gridElements = [];
    const yRange = maxY - minY || 1;
    
    for (let i = 0; i <= lines; i++) {
      const value = minY + (yRange / lines) * i;
      const y = height - paddingBottom - (i / lines) * chartHeight;
      gridElements.push(
        <G key={`grid-${i}`}>
          {/* Grid line */}
          <Line
            x1={paddingLeft}
            y1={y}
            x2={containerWidth - paddingRight}
            y2={y}
            stroke={THEME.colors.border}
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          {/* Label */}
          <SvgText
            x={4}
            y={y - 4}
            fill={THEME.colors.textMuted}
            fontSize={9}
            fontFamily={Platform.OS === 'ios' ? 'Courier' : 'monospace'}
          >
            {Math.round(value)}{ySuffix}
          </SvgText>
        </G>
      );
    }
    return gridElements;
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <View style={{ height, position: 'relative' }}>
        <Svg width={containerWidth} height={height} style={styles.svg}>
          <Defs>
            {datasets.map((d, i) => (
              <LinearGradient key={`grad-${i}`} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={d.color} stopOpacity="0.18" />
                <Stop offset="100%" stopColor={d.color} stopOpacity="0.0" />
              </LinearGradient>
            ))}
          </Defs>

          {/* Render grid lines and Y-axis labels inside Svg */}
          {renderGridLines()}

          {/* Bar Chart rendering */}
          {type === 'bar' && datasets.length > 0 && (
            <G>
              {datasets[0].values.map((val, idx) => {
                const totalPoints = datasets[0].values.length;
                const barWidth = Math.max(10, (chartWidth / totalPoints) * 0.6);
                const xCenter = paddingLeft + (idx / totalPoints) * chartWidth + (chartWidth / totalPoints) / 2;
                const x = xCenter - barWidth / 2;
                
                const yRange = maxY - minY || 1;
                const clampedVal = Math.max(minY, Math.min(maxY, val));
                const barHeight = ((clampedVal - minY) / yRange) * chartHeight;
                const y = height - paddingBottom - barHeight;

                return (
                  <G key={`bar-${idx}`}>
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={datasets[0].color}
                      rx={THEME.radius.sm}
                      onPress={() => {
                        setSelectedPoint({
                          datasetIndex: 0,
                          valueIndex: idx,
                          value: val,
                          label: labels[idx] || '',
                          x: xCenter,
                          y,
                        });
                      }}
                    />
                    {/* Tiny value indicator above bar */}
                    {val > 0 && (
                      <SvgText
                        x={x + barWidth / 2}
                        y={y - 6}
                        fill={THEME.colors.text}
                        fontSize={8.5}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {val}
                      </SvgText>
                    )}
                  </G>
                );
              })}
            </G>
          )}

          {/* Line Chart rendering */}
          {type === 'line' &&
            datasets.map((dataset, datasetIdx) => {
              if (dataset.values.length === 0) return null;

              // Generate SVG path coordinates
              let pathD = '';
              let areaD = '';
              const points: { x: number; y: number }[] = [];

              dataset.values.forEach((val, valIdx) => {
                let { x, y } = getCoordinates(val, valIdx, dataset.values.length);
                
                // Overlap prevention micro-offset logic:
                // Vertically shift overlapping values slightly so all lines are visible
                let overlapCount = 0;
                for (let dIdx = 0; dIdx < datasetIdx; dIdx++) {
                  if (datasets[dIdx].values[valIdx] === val) {
                    overlapCount++;
                  }
                }
                
                if (overlapCount > 0) {
                  y += overlapCount * 3.5;
                }
                
                points.push({ x, y });
                
                if (valIdx === 0) {
                  pathD += `M ${x} ${y}`;
                  areaD += `M ${x} ${height - paddingBottom} L ${x} ${y}`;
                } else {
                  pathD += ` L ${x} ${y}`;
                  areaD += ` L ${x} ${y}`;
                }
              });

              if (points.length > 0) {
                const lastPoint = points[points.length - 1];
                areaD += ` L ${lastPoint.x} ${height - paddingBottom} Z`;
              }

              return (
                <G key={`dataset-${datasetIdx}`}>
                  {/* Fill Area Gradient */}
                  {points.length > 1 && (
                    <Path d={areaD} fill={`url(#gradient-${datasetIdx})`} />
                  )}

                  {/* Glow Shadow Line (render slightly thicker, low opacity stroke behind) */}
                  <Path
                    d={pathD}
                    fill="none"
                    stroke={dataset.color}
                    strokeWidth={6.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={0.22}
                  />

                  {/* Main Line */}
                  <Path
                    d={pathD}
                    fill="none"
                    stroke={dataset.color}
                    strokeWidth={2.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Circular data points */}
                  {points.map((pt, ptIdx) => (
                    <Circle
                      key={`pt-${ptIdx}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={selectedPoint?.datasetIndex === datasetIdx && selectedPoint?.valueIndex === ptIdx ? 6 : 4}
                      fill={THEME.colors.background}
                      stroke={dataset.color}
                      strokeWidth={2.5}
                      onPress={() => {
                        setSelectedPoint({
                          datasetIndex: datasetIdx,
                          valueIndex: ptIdx,
                          value: dataset.values[ptIdx],
                          label: labels[ptIdx] || '',
                          x: pt.x,
                          y: pt.y,
                        });
                      }}
                    />
                  ))}
                </G>
              );
            })}
        </Svg>

        {/* X Axis Labels */}
        <View style={styles.xAxisContainer}>
          {labels.map((lbl, idx) => {
            const totalPoints = labels.length || 1;
            const leftOffset = paddingLeft + (idx / (totalPoints - 1 || 1)) * chartWidth;
            return (
              <Text
                key={`lbl-${idx}`}
                style={[
                  styles.xAxisLabel,
                  {
                    position: 'absolute',
                    left: leftOffset - 18,
                    width: 36,
                    textAlign: 'center',
                  },
                ]}
              >
                {lbl}
              </Text>
            );
          })}
        </View>

        {/* Hover/Tap Tooltip Overlay */}
        {selectedPoint && (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedPoint(null)}
          >
            <View
              style={[
                styles.tooltip,
                {
                  left: Math.max(10, Math.min(containerWidth - 110, selectedPoint.x - 55)),
                  top: Math.max(0, selectedPoint.y - 56),
                  borderColor: datasets[selectedPoint.datasetIndex].color,
                  shadowColor: datasets[selectedPoint.datasetIndex].color,
                },
              ]}
            >
              <Text style={styles.tooltipLabel}>{selectedPoint.label}</Text>
              <Text style={[styles.tooltipValue, { color: datasets[selectedPoint.datasetIndex].color }]}>
                {selectedPoint.value}
                {ySuffix}
              </Text>
              <Text style={styles.tooltipDataset}>
                {datasets[selectedPoint.datasetIndex].label}
              </Text>
            </View>
          </Pressable>
        )}
      </View>

      {/* Legend */}
      {datasets.length > 1 && (
        <View style={styles.legendContainer}>
          {datasets.map((d, i) => (
            <View key={`leg-${i}`} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: d.color }]} />
              <Text style={styles.legendText}>{d.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: THEME.spacing.sm,
    width: '100%',
  },
  svg: {
    zIndex: 1,
  },
  axisLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  xAxisContainer: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    height: 18,
  },
  xAxisLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9.5,
    fontWeight: '500',
  },
  barVal: {
    color: THEME.colors.text,
    fontSize: 8,
    fontWeight: 'bold',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: 'rgba(15, 23, 42, 0.93)', // Translucent Slate 900
    borderWidth: 1.5,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    width: 105,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  tooltipLabel: {
    color: THEME.colors.textMuted,
    fontSize: 9,
    fontWeight: '500',
  },
  tooltipValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  tooltipDataset: {
    color: THEME.colors.textMuted,
    fontSize: 7.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: THEME.spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: THEME.spacing.sm,
    marginVertical: 2,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  legendText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
});
