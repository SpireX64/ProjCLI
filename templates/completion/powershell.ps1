# proj tab completion for PowerShell (5.1+ / 7+).
# Install: iex (proj completion powershell | Out-String)
# Or save: proj completion powershell > $PROFILE.d\proj.ps1; . $PROFILE.d\proj.ps1

$script:ProjComplete = {
  param($wordToComplete, $commandAst, $cursorPosition)

  function Get-ProjCompleteLines([Parameter(Mandatory)][string]$Kind) {
    $raw = & proj __complete $Kind 2>$null
    if (-not $raw) { return @() }
    return @($raw -split '\r?\n' | Where-Object { $_ -ne '' })
  }

  function Out-ProjMatches {
    param(
      [string[]]$Items,
      [string]$Wc,
      # When PS passes an empty wordToComplete, the host appends CompletionText after the cursor
      # without removing the typed prefix; strip the filter prefix from CompletionText in that case.
      [string]$ShellWord = ''
    )
    foreach ($x in $Items) {
      if (-not $x) { continue }
      if ($Wc -and ($x -notlike "$Wc*")) { continue }
      $completionText = $x
      if (-not $ShellWord -and $Wc -and ($x.Length -ge $Wc.Length)) {
        $head = $x.Substring(0, $Wc.Length)
        if ($head.Equals($Wc, [StringComparison]::OrdinalIgnoreCase)) {
          $completionText = $x.Substring($Wc.Length)
        }
      }
      [System.Management.Automation.CompletionResult]::new($completionText, $x, 'ParameterValue', $x)
    }
  }

  $els = @($commandAst.CommandElements)
  if ($els.Count -eq 0) { return }

  $toks = @(
    foreach ($e in $els) {
      if ($e -is [System.Management.Automation.Language.StringConstantExpressionAst]) {
        $e.Value
      } else {
        $t = $e.Extent.Text
        if (($t.Length -ge 2) -and (
            ($t.StartsWith('"') -and $t.EndsWith('"')) -or
            ($t.StartsWith("'") -and $t.EndsWith("'"))
          )) {
          $t.Substring(1, $t.Length - 2)
        } else {
          $t
        }
      }
    }
  )

  $curIdx = $els.Count
  for ($i = 0; $i -lt $els.Count; $i++) {
    if ($cursorPosition -le $els[$i].Extent.EndOffset) {
      $curIdx = $i
      break
    }
  }

  $exe = $toks[0] -replace '\\', '/' -split '/' | Select-Object -Last 1
  if ($exe -notmatch '^(proj|proj\.cmd|proj\.ps1)$') { return }

  $cmdList = @(Get-ProjCompleteLines commands)

  # Completing first token after proj (subcommand)
  if ($curIdx -le 1) {
    $wcCmd = if ($toks.Count -ge 2) { $toks[1] } else { $wordToComplete }
    return Out-ProjMatches -Items $cmdList -Wc $wcCmd -ShellWord $wordToComplete
  }

  # Cursor past 2nd token but 2nd is not a full command: still subcommands, not filesystem paths
  $knownSub = $false
  if ($toks.Count -ge 2) {
    foreach ($c in $cmdList) {
      if ($c.Equals($toks[1], [StringComparison]::OrdinalIgnoreCase)) {
        $knownSub = $true
        break
      }
    }
  }
  if ($curIdx -eq 2 -and $toks.Count -eq 2 -and -not $knownSub) {
    return Out-ProjMatches -Items $cmdList -Wc $toks[1] -ShellWord $wordToComplete
  }

  # Parsed token for filter when $wordToComplete is empty
  $wcToken = if ($toks.Count -gt $curIdx) { $toks[$curIdx] } else { $wordToComplete }

  $sub = $toks[1]
  # Lowercase for switch -Regex (switch -CaseInsensitive is not available on all PS editions)
  $subNorm = $sub.ToLowerInvariant()

  switch -Regex ($subNorm) {
    '^ls$' {
      if ($curIdx -eq 2) {
        $items = @('--json', '-f', '-o', '-t', '--grep', '-h', '--help') + @(Get-ProjCompleteLines tag-ids)
        return Out-ProjMatches -Items $items -Wc $wcToken -ShellWord $wordToComplete
      }
      if ($curIdx -ge 3) {
        $items = @('--json', '-f', '-o', '-t', '--grep') + @(Get-ProjCompleteLines tag-ids)
        return Out-ProjMatches -Items $items -Wc $wcToken -ShellWord $wordToComplete
      }
    }
    '^dir$' {
      if ($curIdx -eq 2) {
        $items = @('-w', '-h', '--help') + @(Get-ProjCompleteLines workspaces)
        return Out-ProjMatches -Items $items -Wc $wcToken -ShellWord $wordToComplete
      }
      if ($curIdx -eq 3) {
        if ($toks[2] -eq '-w') {
          return Out-ProjMatches -Items (Get-ProjCompleteLines workspaces) -Wc $wcToken -ShellWord $wordToComplete
        }
        return Out-ProjMatches -Items @('-w') -Wc $wcToken -ShellWord $wordToComplete
      }
      if ($curIdx -eq 4 -and $toks[3] -eq '-w') {
        return Out-ProjMatches -Items (Get-ProjCompleteLines workspaces) -Wc $wcToken -ShellWord $wordToComplete
      }
    }
    '^use$' {
      if ($curIdx -eq 2) {
        $items = @('-h', '--help') + @(Get-ProjCompleteLines workspaces)
        return Out-ProjMatches -Items $items -Wc $wcToken -ShellWord $wordToComplete
      }
    }
    '^completion$' {
      if ($curIdx -eq 2) {
        return Out-ProjMatches -Items @('bash', 'zsh', 'fish', 'powershell', 'pwsh', '-h', '--help') -Wc $wcToken -ShellWord $wordToComplete
      }
    }
    '^editor$' {
      if ($curIdx -eq 2) {
        $items = @('-h', '--help') + @(Get-ProjCompleteLines editors)
        return Out-ProjMatches -Items $items -Wc $wcToken -ShellWord $wordToComplete
      }
    }
    '^new$' {
      if ($curIdx -eq 2 -or $curIdx -ge 3) {
        return Out-ProjMatches -Items @('--dry-run', '--force', '-h', '--help') -Wc $wcToken -ShellWord $wordToComplete
      }
    }
    '^clone$' {
      if ($curIdx -eq 2) {
        return Out-ProjMatches -Items @('-h', '--help') -Wc $wcToken -ShellWord $wordToComplete
      }
    }
    '^(verify|tags)$' {
      if ($curIdx -eq 2) {
        return Out-ProjMatches -Items @('-h', '--help') -Wc $wcToken -ShellWord $wordToComplete
      }
    }
    '^open$' {
      if ($curIdx -eq 2) {
        $items = @('-h', '--help') + @(Get-ProjCompleteLines projects)
        return Out-ProjMatches -Items $items -Wc $wcToken -ShellWord $wordToComplete
      }
      if ($curIdx -eq 3) {
        $items = @('-r', '--root', '--wt', '-p', '--project', '-h', '--help') + @(Get-ProjCompleteLines editors)
        return Out-ProjMatches -Items $items -Wc $wcToken -ShellWord $wordToComplete
      }
    }
    '^pwd$' {
      if ($curIdx -eq 2) {
        $items = @('-h', '--help') + @(Get-ProjCompleteLines projects)
        return Out-ProjMatches -Items $items -Wc $wcToken -ShellWord $wordToComplete
      }
      if ($curIdx -eq 3) {
        return Out-ProjMatches -Items @('-r', '--root', '--wt', '-p', '--project', '-h', '--help') -Wc $wcToken -ShellWord $wordToComplete
      }
      if ($curIdx -ge 4 -and $toks[3] -eq '--wt') {
        return Out-ProjMatches -Items @('main') -Wc $wcToken -ShellWord $wordToComplete
      }
    }
    '^wt$' {
      if ($curIdx -eq 2) {
        $items = @('-h', '--help') + @(Get-ProjCompleteLines projects)
        return Out-ProjMatches -Items $items -Wc $wcToken -ShellWord $wordToComplete
      }
      if ($curIdx -eq 4) {
        return Out-ProjMatches -Items @('-b', '-h', '--help') -Wc $wcToken -ShellWord $wordToComplete
      }
    }
    '^tag$' {
      if ($curIdx -eq 2) {
        return Out-ProjMatches -Items @('-d', '-p', '-h', '--help') -Wc $wcToken -ShellWord $wordToComplete
      }
      if ($curIdx -eq 3) {
        if ($toks[2] -eq '-p') {
          return Out-ProjMatches -Items (Get-ProjCompleteLines projects) -Wc $wcToken -ShellWord $wordToComplete
        }
        if ($toks[2] -eq '-d') {
          if ($wcToken -like '-*') {
            return Out-ProjMatches -Items @('-p', '-h', '--help') -Wc $wcToken -ShellWord $wordToComplete
          }
          return Out-ProjMatches -Items (Get-ProjCompleteLines tag-ids) -Wc $wcToken -ShellWord $wordToComplete
        }
        $items = @('-d', '-p', '-h', '--help') + @(Get-ProjCompleteLines tag-ids)
        return Out-ProjMatches -Items $items -Wc $wcToken -ShellWord $wordToComplete
      }
      if ($curIdx -eq 4 -and $toks[3] -eq '-p') {
        return Out-ProjMatches -Items (Get-ProjCompleteLines projects) -Wc $wcToken -ShellWord $wordToComplete
      }
      if ($curIdx -eq 5 -and $toks[4] -eq '-p') {
        return Out-ProjMatches -Items (Get-ProjCompleteLines projects) -Wc $wcToken -ShellWord $wordToComplete
      }
    }
    '^status$' {
      if ($curIdx -eq 2) {
        $items = @('--json', '-h', '--help') + @(Get-ProjCompleteLines projects)
        return Out-ProjMatches -Items $items -Wc $wcToken -ShellWord $wordToComplete
      }
    }
    '^rm$' {
      if ($curIdx -eq 2) {
        $items = @('-f', '--force', '-h', '--help') + @(Get-ProjCompleteLines projects)
        return Out-ProjMatches -Items $items -Wc $wcToken -ShellWord $wordToComplete
      }
    }
    '^set$' {
      if ($curIdx -eq 2) {
        $items = @('-d', '-h', '--help') + @(Get-ProjCompleteLines projects)
        return Out-ProjMatches -Items $items -Wc $wcToken -ShellWord $wordToComplete
      }
      if ($curIdx -eq 3) {
        if ($toks[2] -eq '-d') {
          return Out-ProjMatches -Items (Get-ProjCompleteLines projects) -Wc $wcToken -ShellWord $wordToComplete
        }
        return Out-ProjMatches -Items (Get-ProjCompleteLines projrc-keys) -Wc $wcToken -ShellWord $wordToComplete
      }
      if ($curIdx -eq 4) {
        if ($toks[2] -eq '-d') {
          return Out-ProjMatches -Items (Get-ProjCompleteLines projrc-keys) -Wc $wcToken -ShellWord $wordToComplete
        }
        if ($toks[3] -eq '-d') {
          return Out-ProjMatches -Items (Get-ProjCompleteLines projrc-keys) -Wc $wcToken -ShellWord $wordToComplete
        }
        return Out-ProjMatches -Items @('-d') -Wc $wcToken -ShellWord $wordToComplete
      }
    }
    '^get$' {
      if ($curIdx -eq 2) {
        $items = @('-h', '--help') + @(Get-ProjCompleteLines projects)
        return Out-ProjMatches -Items $items -Wc $wcToken -ShellWord $wordToComplete
      }
      if ($curIdx -eq 3) {
        return Out-ProjMatches -Items (Get-ProjCompleteLines projrc-keys) -Wc $wcToken -ShellWord $wordToComplete
      }
    }
    '^fav$' {
      if ($curIdx -eq 2) {
        $items = @('-d', '-h', '--help') + @(Get-ProjCompleteLines projects)
        return Out-ProjMatches -Items $items -Wc $wcToken -ShellWord $wordToComplete
      }
      if ($curIdx -eq 3 -and $toks[2] -eq '-d') {
        return Out-ProjMatches -Items (Get-ProjCompleteLines fav-names) -Wc $wcToken -ShellWord $wordToComplete
      }
    }
    '^mv$' {
      if ($curIdx -eq 2 -or $curIdx -eq 3) {
        $items = @('-h', '--help') + @(Get-ProjCompleteLines projects)
        return Out-ProjMatches -Items $items -Wc $wcToken -ShellWord $wordToComplete
      }
    }
  }

  return
}

Register-ArgumentCompleter -Native -CommandName proj, proj.cmd -ScriptBlock $script:ProjComplete
