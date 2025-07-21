# PowerShell script to delete vehicle ID 10 and its maintenance records
# Load environment variables from .env file
$envFile = Join-Path $PSScriptRoot ".env"
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^([^=]+)=(.*)$") {
        $name = $matches[1]
        $value = $matches[2]
        Set-Item -Path "env:$name" -Value $value
    }
}

# Get the database connection string
$connectionString = $env:DATABASE_URL

# Install required module if not already installed
if (-not (Get-Module -ListAvailable -Name Npgsql)) {
    Write-Host "Installing Npgsql module..."
    Install-Module -Name Npgsql -Force -Scope CurrentUser
}

# Import the module
Import-Module Npgsql

try {
    # Create connection
    Write-Host "Connecting to database..."
    $connection = New-Object Npgsql.NpgsqlConnection
    $connection.ConnectionString = $connectionString
    $connection.Open()

    # Create command for deleting maintenance records
    Write-Host "Deleting maintenance records for vehicle ID 10..."
    $cmdMaintenance = $connection.CreateCommand()
    $cmdMaintenance.CommandText = "DELETE FROM maintenance_records WHERE vehicle_id = 10"
    $maintenanceDeleted = $cmdMaintenance.ExecuteNonQuery()
    Write-Host "Deleted $maintenanceDeleted maintenance records"

    # Create command for deleting the vehicle
    Write-Host "Deleting vehicle with ID 10..."
    $cmdVehicle = $connection.CreateCommand()
    $cmdVehicle.CommandText = "DELETE FROM vehicles WHERE id = 10"
    $vehicleDeleted = $cmdVehicle.ExecuteNonQuery()
    Write-Host "Deleted $vehicleDeleted vehicle"

    Write-Host "Successfully deleted vehicle ID 10 and its maintenance records"
}
catch {
    Write-Host "Error: $_"
}
finally {
    # Close the connection
    if ($connection -and $connection.State -eq 'Open') {
        $connection.Close()
    }
}
