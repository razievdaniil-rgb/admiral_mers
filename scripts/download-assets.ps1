param([string]$Manifest)
$ErrorActionPreference = 'Stop'
$items = Get-Content -Raw -LiteralPath $Manifest | ConvertFrom-Json
$mediaDir = Join-Path $PSScriptRoot '..\public\media'
New-Item -ItemType Directory -Force -Path $mediaDir | Out-Null
foreach ($item in $items) {
  $target = Join-Path $mediaDir $item.file
  & curl.exe -f -L --retry 2 --silent --show-error $item.url -o $target
  if ($LASTEXITCODE -ne 0) { throw "Download failed: $($item.file)" }
  if ((Get-Item -LiteralPath $target).Length -eq 0) { throw "Empty asset: $($item.file)" }
}
