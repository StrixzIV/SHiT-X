auth:
	@npx firebase-tools login

deploy:
	@npm run build
	@npx firebase-tools deploy --only hosting

deploy-blaze:
	@npm ci --prefix functions
	@npm run build:backend
	@npx firebase-tools deploy --config firebase.blaze.json --only functions,hosting

.PHONY: deploy deploy-blaze auth
