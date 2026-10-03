declare module "@heroui/react" {
  export type ColorSpace = "hsb" | "hsl" | "rgb";
  export type ColorChannel =
    | "hue"
    | "saturation"
    | "brightness"
    | "lightness"
    | "red"
    | "green"
    | "blue"
    | "alpha";

  export interface ColorPickerProps {
    children?: React.ReactNode;
    defaultValue?: string;
    value?: string;
    onChange?: (color: string) => void;
    onOpenChange?: (open: boolean) => void;
    className?: string;
  }

  export const ColorPicker: React.FC<ColorPickerProps> & {
    Trigger: React.FC<{
      children?: React.ReactNode;
      className?: string;
      asChild?: boolean;
    }>;
    Popover: React.FC<{
      children?: React.ReactNode;
      placement?: "top" | "bottom";
      className?: string;
    }>;
  };

  export const ColorSwatch: React.FC<{
    size?: "sm" | "md" | "lg";
    className?: string;
  }>;

  export const Label: React.FC<{
    children?: React.ReactNode;
    className?: string;
  }>;

  export const ColorArea: React.FC<{
    colorSpace?: ColorSpace;
    xChannel?: ColorChannel;
    yChannel?: ColorChannel;
    className?: string;
    children?: React.ReactNode;
  }> & {
    Thumb: React.FC;
  };

  export const ColorSlider: React.FC<{
    channel?: ColorChannel;
    colorSpace?: ColorSpace;
    className?: string;
    children?: React.ReactNode;
  }> & {
    Output: React.FC<{ className?: string }>;
    Track: React.FC<{ children?: React.ReactNode; className?: string }>;
    Thumb: React.FC;
  };

  export const Select: React.FC<{
    "aria-label"?: string;
    value: string;
    variant?: string;
    onChange?: (val: string) => void;
    children?: React.ReactNode;
    className?: string;
  }> & {
    Trigger: React.FC<{ children?: React.ReactNode; className?: string }>;
    Value: React.FC<{ className?: string }>;
    Indicator: React.FC;
    Popover: React.FC<{ children?: React.ReactNode; className?: string }>;
  };

  export const ListBox: React.FC<{
    children?: React.ReactNode;
    className?: string;
  }> & {
    Item: React.FC<{
      key?: string;
      id: string;
      textValue?: string;
      children?: React.ReactNode;
      className?: string;
    }>;
    ItemIndicator: React.FC;
  };

  export const ColorField: React.FC<{
    "aria-label"?: string;
    channel: ColorChannel;
    colorSpace: ColorSpace;
    children?: React.ReactNode;
    className?: string;
  }> & {
    Group: React.FC<{ variant?: string; children?: React.ReactNode; className?: string }>;
    Input: React.FC<{ className?: string }>;
  };
}
