$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$localRoot = Join-Path $projectRoot '.local'
$mysqlRoot = Join-Path $localRoot 'mysql-8.4.11-winx64'
$dataRoot = Join-Path $localRoot 'mysql-data'
$mysqld = Join-Path $mysqlRoot 'bin/mysqld.exe'
if (!(Test-Path -LiteralPath $mysqld)) { throw 'Extract the official MySQL 8.4.11 archive into .local first.' }
if (!(Test-Path -LiteralPath $dataRoot)) { throw 'Initialize the dedicated .local/mysql-data directory first.' }
if (netstat -ano | Select-String '^\s*TCP\s+\S+:3308\s+.*LISTENING') { throw 'Port 3308 is occupied; verify the existing process before starting MySQL.' }
$serverArgs = @("--basedir=`"$mysqlRoot`"", "--datadir=`"$dataRoot`"", '--port=3308', '--bind-address=127.0.0.1', '--mysqlx=0', '--skip-log-bin', '--innodb-buffer-pool-size=128M', "--log-error=`"$(Join-Path $localRoot 'mysql-error.log')`"")
$initPath = Join-Path $localRoot 'mysql-init.sql'
if (Test-Path -LiteralPath $initPath) { $serverArgs += "--init-file=`"$initPath`"" }
$mysqlProcess = Start-Process -FilePath $mysqld -ArgumentList $serverArgs -WindowStyle Hidden -PassThru
Write-Output "MySQL process launched (PID $($mysqlProcess.Id)); verify connection to 127.0.0.1:3308."
