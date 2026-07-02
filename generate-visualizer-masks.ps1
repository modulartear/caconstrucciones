Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$assetsDir = Join-Path $root 'frontend\visualizador-assets'

function Fill-RoundedRect {
  param(
    [System.Drawing.Graphics]$Graphics,
    [System.Drawing.Brush]$Brush,
    [double]$X,
    [double]$Y,
    [double]$Width,
    [double]$Height,
    [double]$Radius
  )

  $diameter = [Math]::Min([Math]::Min($Radius * 2, $Width), $Height)
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath

  if ($diameter -le 0) {
    $Graphics.FillRectangle($Brush, $X, $Y, $Width, $Height)
    return
  }

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  $Graphics.FillPath($Brush, $path)
  $path.Dispose()
}

function Draw-Shape {
  param(
    [System.Drawing.Graphics]$Graphics,
    [hashtable]$Shape
  )

  $alpha = if ($Shape.ContainsKey('alpha')) { [Math]::Round([double]$Shape.alpha * 255) } else { 255 }
  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb([int]$alpha, 255, 255, 255))

  try {
    switch ($Shape.kind) {
      'rect' {
        $radius = if ($Shape.ContainsKey('radius')) { $Shape.radius } else { 0 }
        Fill-RoundedRect -Graphics $Graphics -Brush $brush -X $Shape.x -Y $Shape.y -Width $Shape.width -Height $Shape.height -Radius $radius
      }
      'ellipse' {
        $state = $Graphics.Save()
        $Graphics.TranslateTransform($Shape.cx, $Shape.cy)
        $rotation = if ($Shape.ContainsKey('rotation')) { $Shape.rotation } else { 0 }
        $Graphics.RotateTransform($rotation)
        $Graphics.FillEllipse($brush, -$Shape.rx, -$Shape.ry, $Shape.rx * 2, $Shape.ry * 2)
        $Graphics.Restore($state)
      }
      'polygon' {
        $points = @()
        foreach ($point in $Shape.points) {
          $points += [System.Drawing.PointF]::new([single]$point[0], [single]$point[1])
        }
        $Graphics.FillPolygon($brush, $points)
      }
    }
  } finally {
    $brush.Dispose()
  }
}

$templates = @(
  @{
    source = 'wall-original.png'
    outputs = @(
      @{
        file = 'wall-occluders.png'
        shapes = @(
          @{ kind = 'rect'; x = 469; y = 226; width = 142; height = 157; radius = 4 },
          @{ kind = 'rect'; x = 0; y = 66; width = 102; height = 496; radius = 0 },
          @{ kind = 'ellipse'; cx = 122; cy = 364; rx = 82; ry = 142; rotation = -8 },
          @{ kind = 'polygon'; points = @(@(171,404), @(204,392), @(289,390), @(360,394), @(452,392), @(552,393), @(641,390), @(706,398), @(738,411), @(742,531), @(171,531)) },
          @{ kind = 'polygon'; points = @(@(132,481), @(148,465), @(175,447), @(196,447), @(205,472), @(207,530), @(129,530)) }
        )
      }
    )
  },
  @{
    source = 'floor-original.png'
    outputs = @(
      @{
        file = 'floor-occluders.png'
        shapes = @(
          @{ kind = 'polygon'; points = @(@(368,446), @(1104,446), @(1273,645), @(150,645)) },
          @{ kind = 'rect'; x = 1090; y = 423; width = 360; height = 177; radius = 4 },
          @{ kind = 'ellipse'; cx = 385; cy = 482; rx = 43; ry = 47; rotation = 0 },
          @{ kind = 'ellipse'; cx = 1426; cy = 515; rx = 29; ry = 46; rotation = 0 }
        )
      },
      @{
        file = 'floor-shadows.png'
        shapes = @(
          @{ kind = 'polygon'; points = @(@(273,400), @(771,400), @(820,446), @(222,446)); alpha = 0.62 },
          @{ kind = 'polygon'; points = @(@(1020,425), @(1488,425), @(1498,517), @(1070,534)); alpha = 0.55 },
          @{ kind = 'ellipse'; cx = 771; cy = 467; rx = 170; ry = 50; rotation = 0; alpha = 0.5 }
        )
      }
    )
  },
  @{
    source = 'facade-original.png'
    outputs = @(
      @{
        file = 'facade-occluders.png'
        shapes = @(
          @{ kind = 'rect'; x = 94; y = 301; width = 297; height = 179; radius = 2 },
          @{ kind = 'rect'; x = 490; y = 291; width = 95; height = 190; radius = 2 },
          @{ kind = 'rect'; x = 831; y = 304; width = 41; height = 176; radius = 1 },
          @{ kind = 'rect'; x = 387; y = 258; width = 268; height = 22; radius = 1 },
          @{ kind = 'rect'; x = 624; y = 346; width = 12; height = 38; radius = 4 },
          @{ kind = 'polygon'; points = @(@(0,448), @(144,448), @(141,486), @(0,487)) },
          @{ kind = 'polygon'; points = @(@(414,430), @(804,430), @(808,480), @(392,480)) },
          @{ kind = 'polygon'; points = @(@(0,479), @(1023,479), @(1023,684), @(0,684)) }
        )
      },
      @{
        file = 'facade-shadows.png'
        shapes = @(
          @{ kind = 'polygon'; points = @(@(653,267), @(828,267), @(1023,374), @(1023,471), @(620,471), @(620,311)); alpha = 0.68 },
          @{ kind = 'polygon'; points = @(@(387,280), @(654,280), @(622,324), @(421,324)); alpha = 0.52 },
          @{ kind = 'ellipse'; cx = 472; cy = 369; rx = 104; ry = 66; rotation = 0; alpha = 0.42 }
        )
      }
    )
  }
)

foreach ($template in $templates) {
  $sourcePath = Join-Path $assetsDir $template.source
  $image = [System.Drawing.Image]::FromFile($sourcePath)
  try {
    foreach ($output in $template.outputs) {
      $bitmap = New-Object System.Drawing.Bitmap($image.Width, $image.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.Clear([System.Drawing.Color]::FromArgb(255, 0, 0, 0))
        foreach ($shape in $output.shapes) {
          Draw-Shape -Graphics $graphics -Shape $shape
        }
        $bitmap.Save((Join-Path $assetsDir $output.file), [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Output "Generada $($output.file)"
      } finally {
        $graphics.Dispose()
        $bitmap.Dispose()
      }
    }
  } finally {
    $image.Dispose()
  }
}
