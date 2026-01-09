# Production Security Checklist

## ✅ Pre-deployment

- [ ] Verify all sensitive keys are in `.env` (never committed)
- [ ] Run `npm run test:all` to ensure lint, smoke tests, and a11y audit pass
- [ ] Test the build locally with production environment variables
- [ ] Review CORS_ORIGIN and restrict it to your domain
- [ ] Enable helmet.js in `server/index.js`
- [ ] Set up rate limiting thresholds appropriate for your load
- [ ] Verify error messages don't leak internal details

## ✅ Deployment

- [ ] Use HTTPS everywhere (enforce via redirect or HSTS)
- [ ] Deploy backend (proxy) and frontend on separate services
- [ ] Set all environment variables securely (never in git)
- [ ] Use a secrets manager (1Password, HashiCorp Vault, AWS Secrets Manager, etc.)
- [ ] Configure automated backups
- [ ] Set up health checks and monitoring

## ✅ Post-deployment

- [ ] Monitor error logs and performance metrics
- [ ] Test API endpoints from production domain
- [ ] Verify CORS headers are correct
- [ ] Set up alerts for rate limit breaches or errors
- [ ] Conduct a security scan (OWASP ZAP, Snyk, etc.)
- [ ] Document incident response procedures

## ✅ Ongoing

- [ ] Keep dependencies updated
- [ ] Rotate secrets periodically
- [ ] Review logs and metrics regularly
- [ ] Conduct regular security audits
- [ ] Update CI/CD pipeline to run tests automatically
