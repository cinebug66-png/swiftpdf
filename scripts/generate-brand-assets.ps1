Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"
$publicDirectory = Join-Path $PSScriptRoot "..\public"

function New-RoundedRectanglePath {
  param(
    [float]$X,
    [float]$Y,
    [float]$Width,
    [float]$Height,
    [float]$Radius
  )

  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-SwiftPdfMark {
  param(
    [System.Drawing.Graphics]$Graphics,
    [float]$X,
    [float]$Y,
    [float]$Size
  )

  $radius = $Size * 0.24
  $markPath = New-RoundedRectanglePath -X $X -Y $Y -Width $Size -Height $Size -Radius $radius
  $gradientStart = [System.Drawing.Color]::FromArgb(255, 63, 81, 181)
  $gradientEnd = [System.Drawing.Color]::FromArgb(255, 65, 182, 246)
  $gradient = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.PointF]::new($X, $Y),
    [System.Drawing.PointF]::new($X + $Size, $Y + $Size),
    $gradientStart,
    $gradientEnd
  )
  $Graphics.FillPath($gradient, $markPath)

  $paperX = $X + $Size * 0.29
  $paperY = $Y + $Size * 0.21
  $paperWidth = $Size * 0.42
  $paperHeight = $Size * 0.58
  $fold = $Size * 0.13
  $strokeWidth = [Math]::Max(1.25, $Size * 0.055)
  $paperPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $strokeWidth)
  $paperPen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $paperPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $paperPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $paperPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $paperPath.AddLine($paperX + $paperWidth - $fold, $paperY, $paperX, $paperY)
  $paperPath.AddLine($paperX, $paperY, $paperX, $paperY + $paperHeight)
  $paperPath.AddLine($paperX, $paperY + $paperHeight, $paperX + $paperWidth, $paperY + $paperHeight)
  $paperPath.AddLine($paperX + $paperWidth, $paperY + $paperHeight, $paperX + $paperWidth, $paperY + $fold)
  $paperPath.AddLine($paperX + $paperWidth, $paperY + $fold, $paperX + $paperWidth - $fold, $paperY)
  $paperPath.CloseFigure()
  $Graphics.DrawPath($paperPen, $paperPath)

  $foldPath = New-Object System.Drawing.Drawing2D.GraphicsPath
  $foldPath.AddLine($paperX + $paperWidth - $fold, $paperY, $paperX + $paperWidth - $fold, $paperY + $fold)
  $foldPath.AddLine($paperX + $paperWidth - $fold, $paperY + $fold, $paperX + $paperWidth, $paperY + $fold)
  $Graphics.DrawPath($paperPen, $foldPath)

  $Graphics.DrawLine(
    $paperPen,
    $paperX + $Size * 0.085,
    $paperY + $Size * 0.31,
    $paperX + $paperWidth - $Size * 0.085,
    $paperY + $Size * 0.31
  )
  $Graphics.DrawLine(
    $paperPen,
    $paperX + $Size * 0.085,
    $paperY + $Size * 0.42,
    $paperX + $paperWidth - $Size * 0.085,
    $paperY + $Size * 0.42
  )
  $Graphics.DrawLine(
    $paperPen,
    $paperX + $Size * 0.085,
    $paperY + $Size * 0.53,
    $paperX + $paperWidth - $Size * 0.17,
    $paperY + $Size * 0.53
  )

  $paperPen.Dispose()
  $paperPath.Dispose()
  $foldPath.Dispose()
  $gradient.Dispose()
  $markPath.Dispose()
}

function Save-MarkPng {
  param(
    [int]$Size,
    [string]$FileName,
    [float]$PaddingRatio = 0.08
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  $padding = [Math]::Max(0, $Size * $PaddingRatio)
  Draw-SwiftPdfMark -Graphics $graphics -X $padding -Y $padding -Size ($Size - $padding * 2)

  $outputPath = Join-Path $publicDirectory $FileName
  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

function Save-OgImage {
  $width = 1200
  $height = 630
  $bitmap = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $graphics.Clear([System.Drawing.Color]::FromArgb(255, 7, 13, 31))

  $background = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.Point]::new(0, 0),
    [System.Drawing.Point]::new($width, $height),
    [System.Drawing.Color]::FromArgb(255, 7, 13, 31),
    [System.Drawing.Color]::FromArgb(255, 25, 28, 65)
  )
  $graphics.FillRectangle($background, 0, 0, $width, $height)

  $glow = New-Object System.Drawing.Drawing2D.GraphicsPath
  $glow.AddEllipse(700, -240, 720, 720)
  $glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(34, 96, 165, 250))
  $graphics.FillPath($glowBrush, $glow)

  Draw-SwiftPdfMark -Graphics $graphics -X 104 -Y 184 -Size 262

  $brandFont = New-Object System.Drawing.Font("Segoe UI", 82, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $taglineFont = New-Object System.Drawing.Font("Segoe UI", 35, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $labelFont = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 248, 250, 252))
  $mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 186, 199, 222))
  $accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 129, 180, 255))

  $graphics.DrawString("SwiftPDF", $brandFont, $whiteBrush, 430, 202)
  $graphics.DrawString("Free online PDF tools", $taglineFont, $mutedBrush, 436, 310)
  $graphics.DrawString("CONVERT  /  COMPRESS  /  MERGE  /  EDIT", $labelFont, $accentBrush, 438, 382)

  $outputPath = Join-Path $publicDirectory "og-image.png"
  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $accentBrush.Dispose()
  $mutedBrush.Dispose()
  $whiteBrush.Dispose()
  $labelFont.Dispose()
  $taglineFont.Dispose()
  $brandFont.Dispose()
  $glowBrush.Dispose()
  $glow.Dispose()
  $background.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
}

Save-MarkPng -Size 16 -FileName "favicon-16x16.png" -PaddingRatio 0
Save-MarkPng -Size 32 -FileName "favicon-32x32.png" -PaddingRatio 0.03
Save-MarkPng -Size 48 -FileName "favicon-48x48.png" -PaddingRatio 0.04
Save-MarkPng -Size 180 -FileName "apple-touch-icon.png" -PaddingRatio 0.07
Save-MarkPng -Size 192 -FileName "icon-192x192.png" -PaddingRatio 0.07
Save-MarkPng -Size 512 -FileName "icon-512x512.png" -PaddingRatio 0.07
Save-MarkPng -Size 512 -FileName "logo.png" -PaddingRatio 0.07
Save-OgImage
