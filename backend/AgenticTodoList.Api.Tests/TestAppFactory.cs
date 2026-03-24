using PandoraTodoList.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace PandoraTodoList.Api.Tests;

public class TestAppFactory : WebApplicationFactory<Program>
{
    private static readonly InMemoryDatabaseRoot SharedDatabaseRoot = new();
    private string? _webhookSecret;

    public void WithWebhookSecret(string secret) => _webhookSecret = secret;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            services.RemoveAll(typeof(DbContextOptions<AppDbContext>));
            services.RemoveAll(typeof(AppDbContext));
            services.RemoveAll(typeof(IDbContextOptionsConfiguration<AppDbContext>));

            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase("pandora-tests", SharedDatabaseRoot));
        });

        builder.ConfigureAppConfiguration((_, cfg) =>
        {
            var extra = new Dictionary<string, string?>
            {
                ["Auth:ApiKeys:0"] = "test-api-key-1234"
            };
            if (_webhookSecret is not null)
                extra["DevLake:WebhookSecret"] = _webhookSecret;
            cfg.AddInMemoryCollection(extra);
        });
    }
}

