deploy:
	@npm run build
	@firebase deploy

.PHONY: deploy