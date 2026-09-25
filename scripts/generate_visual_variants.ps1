$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$srcDir = 'C:\Users\chief\Downloads\Gumroad-Pack\visuals'
$sqDir = 'C:\Users\chief\Downloads\Gumroad-Pack\visuals-square'
$ssDir = 'C:\Users\chief\Downloads\Gumroad-Pack\visuals-story-safe'

New-Item -ItemType Directory -Path $sqDir -Force | Out-Null
New-Item -ItemType Directory -Path $ssDir -Force | Out-Null

Get-ChildItem $srcDir -Filter *.png | ForEach-Object {
    $srcPath = $_.FullName
    $name = $_.Name
    $img = [System.Drawing.Image]::FromFile($srcPath)

    # Square 1080x1080 center-crop
    $sqBmp = New-Object System.Drawing.Bitmap(1080, 1080)
    $sqBmp.SetResolution(72, 72)
    $gSq = [System.Drawing.Graphics]::FromImage($sqBmp)
    $gSq.SmoothingMode = 'HighQuality'
    $gSq.InterpolationMode = 'HighQualityBicubic'
    $gSq.PixelOffsetMode = 'HighQuality'

    $scaleSq = [Math]::Max(1080.0 / $img.Width, 1080.0 / $img.Height)
    $sw = [int]([Math]::Round($img.Width * $scaleSq))
    $sh = [int]([Math]::Round($img.Height * $scaleSq))
    $sx = [int]([Math]::Round((1080 - $sw) / 2))
    $sy = [int]([Math]::Round((1080 - $sh) / 2))

    $gSq.DrawImage($img, $sx, $sy, $sw, $sh)
    $sqOut = Join-Path $sqDir $name
    $sqBmp.Save($sqOut, [System.Drawing.Imaging.ImageFormat]::Png)

    $gSq.Dispose()
    $sqBmp.Dispose()

    # Story-safe 1080x1920 with top/bottom safe guides
    $ssBmp = New-Object System.Drawing.Bitmap(1080, 1920)
    $ssBmp.SetResolution(72, 72)
    $gSs = [System.Drawing.Graphics]::FromImage($ssBmp)
    $gSs.SmoothingMode = 'HighQuality'
    $gSs.InterpolationMode = 'HighQualityBicubic'
    $gSs.PixelOffsetMode = 'HighQuality'

    $gSs.DrawImage($img, 0, 0, 1080, 1920)

    $topBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(95, 0, 0, 0))
    $botBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(95, 0, 0, 0))
    $guidePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(170, 255, 255, 255), 2)

    $gSs.FillRectangle($topBrush, 0, 0, 1080, 250)
    $gSs.FillRectangle($botBrush, 0, 1600, 1080, 320)

    $gSs.DrawLine($guidePen, 0, 250, 1080, 250)
    $gSs.DrawLine($guidePen, 0, 1600, 1080, 1600)

    $labelFont = New-Object System.Drawing.Font('Segoe UI', 26, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $gSs.DrawString('STORY SAFE: KEEP TEXT BELOW THIS LINE', $labelFont, [System.Drawing.Brushes]::White, 36, 180)
    $gSs.DrawString('STORY SAFE: KEEP CTA ABOVE THIS LINE', $labelFont, [System.Drawing.Brushes]::White, 36, 1535)

    $ssOut = Join-Path $ssDir $name
    $ssBmp.Save($ssOut, [System.Drawing.Imaging.ImageFormat]::Png)

    $labelFont.Dispose()
    $topBrush.Dispose()
    $botBrush.Dispose()
    $guidePen.Dispose()
    $gSs.Dispose()
    $ssBmp.Dispose()

    $img.Dispose()
}

[PSCustomObject]@{
    SquareFolder = $sqDir
    StorySafeFolder = $ssDir
    SquareCount = (Get-ChildItem $sqDir -Filter *.png).Count
    StorySafeCount = (Get-ChildItem $ssDir -Filter *.png).Count
} | Format-List
