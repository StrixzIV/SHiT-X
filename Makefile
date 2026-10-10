auth:
	@firebase login

deploy:
	@npm run build
	@firebase deploy

.PHONY: deploy auth
