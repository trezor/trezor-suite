ghpages:
	yarn run build
	git stash
	git checkout gh-pages
	cp -r ./build/* ./
	git add .
	git commit -m "new build"
	git push
	make clean
	git checkout v7
	git stash pop

build-test:
	yarn run build
	rsync -avz --delete -e ssh ./build/* admin@dev.sldev.cz:~/sisyfos/www/connect-explorer

clean:
	rm -rf css
	rm -rf fonts
	rm -rf js
	rm ./favicon.ico
	rm ./favicon.png
	rm ./index.html