using EventManagementApp.Application.Common;
using DnsClient;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EventManagementApp.Infrastructure.EmailVerification;

public interface IDnsMxRecordChecker
{
    Task<bool> DomainAcceptsMailAsync(string domain, CancellationToken cancellationToken = default);
}

public class DnsMxRecordChecker : IDnsMxRecordChecker
{
    private readonly LookupClient _lookupClient;
    private readonly ILogger<DnsMxRecordChecker> _logger;

    public DnsMxRecordChecker(IOptions<EmailVerificationSettings> options, ILogger<DnsMxRecordChecker> logger)
    {
        _logger = logger;
        var timeout = TimeSpan.FromSeconds(options.Value.DnsTimeoutSeconds);
        _lookupClient = new LookupClient(new LookupClientOptions
        {
            Timeout = timeout,
            Retries = 1
        });
    }

    public async Task<bool> DomainAcceptsMailAsync(string domain, CancellationToken cancellationToken = default)
    {
        try
        {
            var mxResult = await _lookupClient.QueryAsync(domain, QueryType.MX, cancellationToken: cancellationToken);
            if (mxResult.HasError)
            {
                _logger.LogDebug("MX lookup error for {Domain}: {Error}", domain, mxResult.ErrorMessage);
                return false;
            }

            if (mxResult.Answers.MxRecords().Any())
            {
                return true;
            }

            // RFC 5321: if no MX, fall back to A/AAAA record for the domain.
            var aResult = await _lookupClient.QueryAsync(domain, QueryType.A, cancellationToken: cancellationToken);
            if (aResult.Answers.ARecords().Any())
            {
                return true;
            }

            var aaaaResult = await _lookupClient.QueryAsync(domain, QueryType.AAAA, cancellationToken: cancellationToken);
            return aaaaResult.Answers.AaaaRecords().Any();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "DNS lookup failed for domain {Domain}", domain);
            return false;
        }
    }
}
