$ErrorActionPreference='Stop'
$reportDir='C:\Users\chief\Documents\pc-cleanup-reports-fast'
New-Item -ItemType Directory -Force -Path $reportDir | Out-Null
$roots=@('C:\Users\chief\Desktop','C:\Users\chief\Documents','C:\Users\chief\Downloads','C:\Users\chief\Pictures','C:\Users\chief\Videos','C:\Users\chief\Music') | Where-Object { Test-Path $_ }
$excludePattern='\\(node_modules|\.git|venv|\.venv|__pycache__)\\'

$allFiles=foreach($r in $roots){
  Get-ChildItem -LiteralPath $r -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch $excludePattern }
}
$allFiles=$allFiles | Where-Object { $_.FullName -notlike "$reportDir*" }

$cut=(Get-Date).AddDays(-30)
$stale=$allFiles | Where-Object {
  $lu = if($_.LastAccessTime -gt $_.LastWriteTime){$_.LastAccessTime}else{$_.LastWriteTime}
  $lu -lt $cut
}

$docExt=@('.pdf','.doc','.docx','.txt','.md','.rtf','.odt','.xls','.xlsx','.csv','.ppt','.pptx')
$docFiles=$allFiles | Where-Object { $docExt -contains $_.Extension.ToLowerInvariant() }
$dupeRows=New-Object System.Collections.Generic.List[object]
$sizeGroups=$docFiles | Group-Object Length | Where-Object { $_.Count -gt 1 }
foreach($sg in $sizeGroups){
  $hashGroups=$sg.Group | Group-Object { (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash } | Where-Object { $_.Count -gt 1 }
  foreach($hg in $hashGroups){
    $sorted=$hg.Group | Sort-Object LastWriteTime -Descending
    $i=0
    foreach($f in $sorted){
      $dupeRows.Add([pscustomobject]@{
        Hash=$hg.Name
        Size=$f.Length
        Keep=($i -eq 0)
        FullName=$f.FullName
        LastWriteTime=$f.LastWriteTime
        LastAccessTime=$f.LastAccessTime
      }) | Out-Null
      $i++
    }
  }
}

$dupesToRecycle=$dupeRows | Where-Object { -not $_.Keep } | Select-Object -ExpandProperty FullName
$staleToRecycle=$stale | Select-Object -ExpandProperty FullName
$targets=($dupesToRecycle + $staleToRecycle | Sort-Object -Unique)

$stale | Select-Object FullName,Length,LastWriteTime,LastAccessTime | Export-Csv -NoTypeInformation -Path (Join-Path $reportDir 'stale-over-30d.csv')
$dupeRows | Export-Csv -NoTypeInformation -Path (Join-Path $reportDir 'duplicate-docs-by-hash.csv')
$targets | ForEach-Object { [pscustomobject]@{ FullName=$_ } } | Export-Csv -NoTypeInformation -Path (Join-Path $reportDir 'recycle-targets.csv')

Add-Type -AssemblyName Microsoft.VisualBasic
$moved=New-Object System.Collections.Generic.List[string]
$failed=New-Object System.Collections.Generic.List[string]
foreach($p in $targets){
  if(Test-Path -LiteralPath $p){
    try {
      [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($p,[Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs,[Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin)
      $moved.Add($p) | Out-Null
    } catch {
      $failed.Add(("{0} :: {1}" -f $p,$_.Exception.Message)) | Out-Null
    }
  }
}

$summary=[pscustomobject]@{
  Roots=($roots -join '; ')
  TotalFiles=$allFiles.Count
  StaleCount=$stale.Count
  DuplicateDocGroups=(($dupeRows|Group-Object Hash).Count)
  DuplicateDocCopiesToRecycle=($dupeRows|Where-Object{-not $_.Keep}).Count
  Targets=$targets.Count
  Moved=$moved.Count
  Failed=$failed.Count
  StaleBytes=[int64](($stale|Measure-Object Length -Sum).Sum)
  DuplicateDocWasteBytes=[int64](($dupeRows|Where-Object{-not $_.Keep}|Measure-Object Size -Sum).Sum)
}
$summary | Export-Csv -NoTypeInformation -Path (Join-Path $reportDir 'summary.csv')
$summary | Format-List
'SAMPLE_MOVED:'
$moved | Select-Object -First 25
"REPORT_DIR=$reportDir"
