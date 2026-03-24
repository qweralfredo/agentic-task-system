using Microsoft.Extensions.Configuration;

namespace PandoraTodoList.Api.Services;

/// <summary>
/// Validates X-Pandora-Api-Key headers against configured keys (BL-14 SP-11).
/// Keys are stored in configuration as Auth:ApiKeys:0, Auth:ApiKeys:1, etc.
/// </summary>
public sealed class ApiKeyService
{
    private readonly HashSet<string> _validKeys;

    public ApiKeyService(IConfiguration configuration)
    {
        _validKeys = configuration
            .GetSection("Auth:ApiKeys")
            .GetChildren()
            .Select(c => c.Value ?? string.Empty)
            .Where(v => !string.IsNullOrEmpty(v))
            .ToHashSet(StringComparer.Ordinal);
    }

    public bool IsValid(string? key) =>
        !string.IsNullOrEmpty(key) && _validKeys.Contains(key);
}
