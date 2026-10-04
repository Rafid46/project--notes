"use client";

import type { ColorChannel, ColorSpace } from "@/lib/heroui";

import {
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  Label,
  ListBox,
  Select,
  DEFAULT_PRESET_COLORS,
} from "@/lib/heroui";
export { DEFAULT_PRESET_COLORS };
import { useState } from "react";

export function WithFields() {
  const [colorSpace, setColorSpace] = useState<ColorSpace>("hsl");

  const colorChannelsByColorSpace: Record<ColorSpace, ColorChannel[]> = {
    hsb: ["hue", "saturation", "brightness"],
    hsl: ["hue", "saturation", "lightness"],
    rgb: ["red", "green", "blue"],
  };

  return (
    <ColorPicker defaultValue="hsla(220, 90%, 50%, 0.8)">
      <ColorPicker.Trigger>
        <ColorSwatch size="lg" />
        <Label>Pick a color</Label>
      </ColorPicker.Trigger>
      <ColorPicker.Popover className="w-64 gap-2">
        <ColorArea
          className="max-w-full"
          colorSpace="hsb"
          xChannel="saturation"
          yChannel="brightness"
        >
          <ColorArea.Thumb />
        </ColorArea>
        <ColorSlider channel="hue" className="gap-1 px-1" colorSpace="hsb">
          <Label>Hue</Label>
          <ColorSlider.Output className="text-muted" />
          <ColorSlider.Track>
            <ColorSlider.Thumb />
          </ColorSlider.Track>
        </ColorSlider>
        <ColorPicker.Presets />
        <Select
          aria-label="Color space"
          value={colorSpace}
          variant="secondary"
          onChange={(value) => setColorSpace(value as ColorSpace)}
        >
          <Select.Trigger>
            <Select.Value className="uppercase" />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {Object.keys(colorChannelsByColorSpace).map((space) => (
                <ListBox.Item
                  key={space}
                  className="uppercase"
                  id={space}
                  textValue={space}
                >
                  {space}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <div className="grid w-full grid-cols-3 items-center gap-2">
          {colorChannelsByColorSpace[colorSpace].map((channel) => (
            <ColorField
              key={channel}
              aria-label={channel}
              channel={channel}
              colorSpace={colorSpace}
            >
              <ColorField.Group variant="secondary">
                <ColorField.Input />
              </ColorField.Group>
            </ColorField>
          ))}
        </div>
      </ColorPicker.Popover>
    </ColorPicker>
  );
}

export interface CustomColorPickerProps {
  value?: string;
  defaultValue?: string;
  onChange?: (color: string) => void;
  onOpenChange?: (open: boolean) => void;
  label?: string;
  className?: string;
  placement?: "top" | "bottom";
  align?: "start" | "end" | "center";
  trigger?: React.ReactNode;
  children?: React.ReactNode;
  presetColors?: string[];
}

export function CustomColorPicker({
  value,
  defaultValue = "hsla(220, 90%, 50%, 0.8)",
  onChange,
  onOpenChange,
  label = "Pick a color",
  className = "",
  placement = "bottom",
  align = "end",
  trigger,
  children,
  presetColors,
}: CustomColorPickerProps) {
  const [colorSpace, setColorSpace] = useState<ColorSpace>("hsl");

  const colorChannelsByColorSpace: Record<ColorSpace, ColorChannel[]> = {
    hsb: ["hue", "saturation", "brightness"],
    hsl: ["hue", "saturation", "lightness"],
    rgb: ["red", "green", "blue"],
  };

  const triggerNode = children || trigger;

  return (
    <ColorPicker
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      onOpenChange={onOpenChange}
      className={className}
    >
      {triggerNode ? (
        <ColorPicker.Trigger asChild>{triggerNode}</ColorPicker.Trigger>
      ) : (
        <ColorPicker.Trigger>
          <ColorSwatch size="lg" />
          <Label>{label}</Label>
        </ColorPicker.Trigger>
      )}
      <ColorPicker.Popover
        placement={placement}
        align={align}
        className="w-64 gap-2"
      >
        <ColorArea
          className="max-w-full"
          colorSpace="hsb"
          xChannel="saturation"
          yChannel="brightness"
        >
          <ColorArea.Thumb />
        </ColorArea>
        <ColorSlider channel="hue" className="gap-1 px-1" colorSpace="hsb">
          <Label>Hue</Label>
          <ColorSlider.Output className="text-muted" />
          <ColorSlider.Track>
            <ColorSlider.Thumb />
          </ColorSlider.Track>
        </ColorSlider>
        <ColorPicker.Presets colors={presetColors} />
        <Select
          aria-label="Color space"
          value={colorSpace}
          variant="secondary"
          onChange={(val) => setColorSpace(val as ColorSpace)}
        >
          <Select.Trigger>
            <Select.Value className="uppercase" />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {Object.keys(colorChannelsByColorSpace).map((space) => (
                <ListBox.Item
                  key={space}
                  className="uppercase"
                  id={space}
                  textValue={space}
                >
                  {space}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <div className="grid w-full grid-cols-3 items-center gap-2">
          {colorChannelsByColorSpace[colorSpace].map((channel) => (
            <ColorField
              key={channel}
              aria-label={channel}
              channel={channel}
              colorSpace={colorSpace}
            >
              <ColorField.Group variant="secondary">
                <ColorField.Input />
              </ColorField.Group>
            </ColorField>
          ))}
        </div>
      </ColorPicker.Popover>
    </ColorPicker>
  );
}

export default CustomColorPicker;
