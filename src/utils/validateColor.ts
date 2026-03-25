export interface ColorValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
}

export function validateHexColor(color: string): ColorValidationResult {
  if (!color.match(/^#[0-9A-Fa-f]{6}$/)) {
    return {
      valid: false,
      error: "Invalid color format. Color should be a hex color code (e.g., '#FF0000')"
    };
  }
  return { valid: true, normalized: color.toUpperCase() };
}
