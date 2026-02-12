$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

function New-Color([int]$a, [int]$r, [int]$g, [int]$b) {
  [System.Drawing.Color]::FromArgb($a, $r, $g, $b)
}

function New-Graphics([System.Drawing.Bitmap]$bitmap) {
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics
}

function Draw-SoltixCore(
  [System.Drawing.Graphics]$graphics,
  [float]$size,
  [System.Drawing.Color]$startColor,
  [System.Drawing.Color]$endColor,
  [int]$style
) {
  $pad = $size * 0.12
  $rect = [System.Drawing.RectangleF]::new($pad, $pad, $size - (2 * $pad), $size - (2 * $pad))

  $shadowPen = [System.Drawing.Pen]::new((New-Color 130 0 0 0), $size * 0.10)
  $graphics.DrawEllipse($shadowPen, $rect)
  $shadowPen.Dispose()

  $grad = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.PointF]::new($rect.Left, $rect.Top),
    [System.Drawing.PointF]::new($rect.Right, $rect.Bottom),
    $startColor,
    $endColor
  )
  $ringPen = [System.Drawing.Pen]::new($grad, $size * 0.045)
  $graphics.DrawEllipse($ringPen, $rect)
  $ringPen.Dispose()
  $grad.Dispose()

  $font = [System.Drawing.Font]::new("Segoe UI", $size * 0.43, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $textBrush = [System.Drawing.SolidBrush]::new((New-Color 248 255 255 255))
  $txt = if ($style -eq 5) { "SX" } else { "S" }
  $textSize = $graphics.MeasureString($txt, $font)
  $x = ($size - $textSize.Width) / 2
  $y = ($size - $textSize.Height) / 2 - ($size * 0.03)
  $graphics.DrawString($txt, $font, $textBrush, [System.Drawing.PointF]::new($x, $y))

  if ($style -eq 2) {
    $dotBrush = [System.Drawing.SolidBrush]::new((New-Color 255 255 255 255))
    $dot = $size * 0.045
    $graphics.FillEllipse($dotBrush, $size * 0.73, $size * 0.24, $dot, $dot)
    $dotBrush.Dispose()
  }
  if ($style -eq 3) {
    $linePen = [System.Drawing.Pen]::new((New-Color 215 255 255 255), $size * 0.016)
    $graphics.DrawArc($linePen, $size * 0.26, $size * 0.22, $size * 0.48, $size * 0.48, 200, 120)
    $linePen.Dispose()
  }
  if ($style -eq 4) {
    $squarePen = [System.Drawing.Pen]::new((New-Color 215 255 255 255), $size * 0.012)
    $graphics.DrawRectangle($squarePen, $size * 0.29, $size * 0.29, $size * 0.42, $size * 0.42)
    $squarePen.Dispose()
  }

  $textBrush.Dispose()
  $font.Dispose()
}

function New-IconImage(
  [string]$outPath,
  [int]$size,
  [System.Drawing.Color]$startColor,
  [System.Drawing.Color]$endColor,
  [int]$style,
  [bool]$transparentBackground
) {
  $bitmap = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = New-Graphics $bitmap

  if ($transparentBackground) {
    $graphics.Clear([System.Drawing.Color]::Transparent)
  } else {
    $graphics.Clear([System.Drawing.Color]::Black)
  }

  Draw-SoltixCore $graphics $size $startColor $endColor $style

  $graphics.Dispose()
  $bitmap.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

function Resize-Png([string]$sourcePath, [string]$targetPath, [int]$size) {
  $source = [System.Drawing.Image]::FromFile($sourcePath)
  $bitmap = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = New-Graphics $bitmap
  $graphics.Clear([System.Drawing.Color]::Transparent)
  $graphics.DrawImage($source, 0, 0, $size, $size)
  $graphics.Dispose()
  $source.Dispose()
  $bitmap.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

function New-DappGraphic1200([string]$outPath) {
  $size = 1200
  $bitmap = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = New-Graphics $bitmap
  $graphics.Clear([System.Drawing.Color]::Black)

  $glowPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $glowPath.AddEllipse([System.Drawing.RectangleF]::new(120, 80, 960, 960))
  $glowBrush = [System.Drawing.Drawing2D.PathGradientBrush]::new($glowPath)
  $glowBrush.CenterColor = New-Color 120 247 203 112
  $glowBrush.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 0, 0, 0))
  $graphics.FillEllipse($glowBrush, 60, 20, 1080, 1080)
  $glowBrush.Dispose()
  $glowPath.Dispose()

  Draw-SoltixCore $graphics 760 (New-Color 255 247 203 112) (New-Color 255 173 120 26) 1

  $taglineFont = [System.Drawing.Font]::new("Segoe UI", 56, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $subFont = [System.Drawing.Font]::new("Segoe UI", 30, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $taglineBrush = [System.Drawing.SolidBrush]::new((New-Color 245 255 255 255))
  $subBrush = [System.Drawing.SolidBrush]::new((New-Color 190 255 255 255))

  $tagline = "SolTix"
  $subtitle = "Wallet-first on-chain ticketing dApp"

  $tagSize = $graphics.MeasureString($tagline, $taglineFont)
  $subSize = $graphics.MeasureString($subtitle, $subFont)
  $graphics.DrawString($tagline, $taglineFont, $taglineBrush, [System.Drawing.PointF]::new(($size - $tagSize.Width) / 2, 900))
  $graphics.DrawString($subtitle, $subFont, $subBrush, [System.Drawing.PointF]::new(($size - $subSize.Width) / 2, 980))

  $taglineBrush.Dispose()
  $subBrush.Dispose()
  $taglineFont.Dispose()
  $subFont.Dispose()
  $graphics.Dispose()

  $bitmap.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $bitmap.Dispose()
}

$palettes = @(
  @{ Start = (New-Color 255 247 203 112); End = (New-Color 255 173 120 26); Style = 1 },
  @{ Start = (New-Color 255 113 219 255); End = (New-Color 255 24 136 185); Style = 2 },
  @{ Start = (New-Color 255 140 255 184); End = (New-Color 255 38 169 109); Style = 3 },
  @{ Start = (New-Color 255 255 166 166); End = (New-Color 255 197 58 58); Style = 4 },
  @{ Start = (New-Color 255 199 181 255); End = (New-Color 255 105 84 173); Style = 5 }
)

$iconsDir = "assets/images"
$index = 1
foreach ($palette in $palettes) {
  $fileName = "{0}/soltix-icon-{1}.png" -f $iconsDir, $index
  New-IconImage $fileName 1024 $palette.Start $palette.End $palette.Style $false
  $index++
}

# Use icon 1 as the build default
Copy-Item -Force "$iconsDir/soltix-icon-1.png" "$iconsDir/icon.png"
Copy-Item -Force "$iconsDir/soltix-icon-1.png" "$iconsDir/splash-icon.png"

# Android adaptive icon assets
New-IconImage "$iconsDir/android-icon-background.png" 1024 (New-Color 255 0 0 0) (New-Color 255 0 0 0) 1 $false
New-IconImage "$iconsDir/android-icon-foreground.png" 1024 (New-Color 255 247 203 112) (New-Color 255 173 120 26) 1 $true
New-IconImage "$iconsDir/android-icon-monochrome.png" 1024 (New-Color 255 255 255 255) (New-Color 255 255 255 255) 1 $true

# Web favicon based on icon 1
Resize-Png "$iconsDir/soltix-icon-1.png" "$iconsDir/favicon.png" 48

New-DappGraphic1200 "$iconsDir/soltix-dapp-1200x1200.png"

Write-Output "Generated 5 SolTix icons, refreshed build assets, and created soltix-dapp-1200x1200.png."
