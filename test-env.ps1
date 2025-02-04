# Set test environment variables
$env:TEST_TOKEN = "test_value_123"
$env:EXPO_TOKEN = "`$EXPO_TOKEN"  # Using PowerShell syntax

Write-Host "Testing environment variable expansion:"
Write-Host "----------------------------------------"
Write-Host "TEST_TOKEN: $env:TEST_TOKEN"
Write-Host "Raw EXPO_TOKEN value: $env:EXPO_TOKEN"
Write-Host "----------------------------------------" 