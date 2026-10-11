auth:
	@npx firebase-tools login

deploy:
	@npm ci --prefix functions
	@npm run build
	@npx firebase-tools deploy --only functions:companion,hosting

.PHONY: deploy auth
