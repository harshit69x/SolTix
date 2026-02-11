# Windows Installation Guide for Solana

## Issue: curl SSL/TLS Error

If you're getting `schannel: failed to receive handshake, SSL/TLS connection failed`, use one of these alternative methods:

---

## Method 1: PowerShell Download with TLS Fix (Recommended)

Open PowerShell as Administrator and run:

```powershell
# Enable TLS 1.2 (fixes SSL/TLS errors)
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Create directory
New-Item -Path "C:\solana-install-tmp" -ItemType Directory -Force

# Download using PowerShell
Invoke-WebRequest -Uri "https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "C:\solana-install-tmp\solana-install-init.exe" -UseBasicParsing

# Run installer
C:\solana-install-tmp\solana-install-init.exe stable
```

---

## Method 2: Direct Browser Download

1. Open browser and go to: https://github.com/solana-labs/solana/releases/tag/v1.18.8
2. Download `solana-install-init-x86_64-pc-windows-msvc.exe`
3. Save to `C:\solana-install-tmp\`
4. Open PowerShell and run:
```powershell
C:\solana-install-tmp\solana-install-init.exe v1.18.8
```

---

## Method 3: Use Latest Stable Version

Try the stable channel installer instead:

```powershell
# Download latest stable
Invoke-WebRequest -Uri "https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "C:\solana-install-tmp\solana-install-init.exe" -UseBasicParsing

# Install stable version
C:\solana-install-tmp\solana-install-init.exe stable
```

---

## Method 4: Use WSL (Windows Subsystem for Linux)

If you have WSL installed:

```bash
# In WSL terminal
sh -c "$(curl -sSfL https://release.solana.com/v1.18.8/install)"
```

---

## After Successful Installation

1. **Close and reopen PowerShell** (important!)

2. **Verify installation:**
```powershell
solana --version
```

You should see something like:
```
solana-cli 1.18.8
```

3. **Add to PATH if needed:**

If `solana` command not found, add to PATH:

```powershell
# Add to PATH for current session
$env:PATH += ";$HOME\.local\share\solana\install\active_release\bin"

# Add permanently (run as Administrator)
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$HOME\.local\share\solana\install\active_release\bin", [EnvironmentVariableTarget]::User)
```

Then close and reopen PowerShell.

---

## Quick Install Script (All-in-One)

Copy this entire block into PowerShell as Administrator:

```powershell
Write-Host "Installing Solana CLI..." -ForegroundColor Green

# Fix TLS/SSL issues
Write-Host "Enabling TLS 1.2..." -ForegroundColor Yellow
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Create temp directory
New-Item -Path "C:\solana-install-tmp" -ItemType Directory -Force | Out-Null

# Download installer
Write-Host "Downloading installer..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "C:\solana-install-tmp\solana-install-init.exe" -UseBasicParsing
    Write-Host "Download complete!" -ForegroundColor Green
} catch {
    Write-Host "Download failed. Trying alternative URL..." -ForegroundColor Yellow
    try {
        # Try GitHub releases as backup
        Invoke-WebRequest -Uri "https://github.com/solana-labs/solana/releases/download/v1.18.8/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "C:\solana-install-tmp\solana-install-init.exe" -UseBasicParsing
        Write-Host "Download complete!" -ForegroundColor Green
    } catch {
        Write-Host "Download failed. Please use browser download method." -ForegroundColor Red
        Write-Host "Go to: https://github.com/solana-labs/solana/releases" -ForegroundColor Yellow
        exit 1
    }
}

# Run installer
Write-Host "Running installer..." -ForegroundColor Yellow
Start-Process -FilePath "C:\solana-install-tmp\solana-install-init.exe" -ArgumentList "stable" -Wait

# Add to PATH
$solanaPath = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
$currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
if ($currentPath -notlike "*$solanaPath*") {
    Write-Host "Adding Solana to PATH..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$solanaPath", [EnvironmentVariableTarget]::User)
    $env:PATH += ";$solanaPath"
}

Write-Host "`nInstallation complete!" -ForegroundColor Green
Write-Host "Please close and reopen PowerShell, then run: solana --version" -ForegroundColor Yellow
```

---

## Troubleshooting

### "solana: command not found" after installation

**Solution 1:** Close and reopen PowerShell

**Solution 2:** Manually add to PATH:
```powershell
$env:PATH += ";$HOME\.local\share\solana\install\active_release\bin"
```

**Solution 3:** Check installation location:
```powershell
Get-ChildItem -Path "$HOME\.local\share\solana" -Recurse -Filter "solana.exe"
```

### "Access Denied" errors

Run PowerShell as Administrator

### Firewall blocking download

- Temporarily disable firewall
- Or add exception for PowerShell
- Or use browser download method

---

## Next Steps After Installation

1. **Verify Solana is working:**
```powershell
solana --version
solana-keygen --version
```

2. **Create wallet:**
```powershell
solana-keygen new
```

3. **Configure for devnet:**
```powershell
solana config set --url devnet
```

4. **Get devnet SOL:**
```powershell
solana airdrop 2
```

5. **Check balance:**
```powershell
solana balance
```

---

## If All Else Fails: Use Pre-built Binary

1. Download from: https://github.com/solana-labs/solana/releases
2. Extract to `C:\solana`
3. Add `C:\solana\bin` to PATH manually:
   - Search Windows for "Environment Variables"
   - Edit "Path" under User Variables
   - Add `C:\solana\bin`
   - Click OK
   - Restart PowerShell

---

## Alternative: Use Docker

If you have Docker Desktop on Windows:

```powershell
# Pull Solana image
docker pull solanalabs/solana:stable

# Run Solana commands
docker run --rm solanalabs/solana:stable solana --version
```

---

## Contact & Support

If still having issues:
- Solana Discord: https://discord.gg/solana
- GitHub Issues: https://github.com/solana-labs/solana/issues
- Stack Exchange: https://solana.stackexchange.com/
