# $env:path -split ';' | Select-String  "yarn" &&  $env:path -split ';' | Select-String "pnpm" &&  $env:path -split ';' | Select-String "npm" &&  $env:path -split ';' | Select-String "bun"

Function detectPackageManager {
    $packageManagers = @("yarn", "pnpm", "npm", "bun")
    $foundAny = $false
    foreach ($manager in $packageManagers) {
        $command = Get-Command $manager -ErrorAction SilentlyContinue
        if ($null -ne $command) {
            $foundAny = $true
            $path = $command.Source
            $version = ""
            try {
                $versionOutput = & $command.Source --version 2>&1
                $version = ($versionOutput | Select-Object -First 1)
            } catch {
                $version = "Error getting version"
            }
            Write-Output "$manager --- Path: $path --- Version: $version"
        }
    }
    if (-not $foundAny) {
        Write-Output "No package managers detected."
    }
    
}

Set-alias -Name "dpkg" -Value "detectPackageManager"

dpkg
