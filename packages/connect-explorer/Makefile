ghpages:
	yarn run build
	git stash
	git checkout gh-pages
	cp -r ./build/* ./
	git add .
	git commit -m "new build"
	git push
	make clean
	git checkout master
	git stash pop

clean:
	rm -rf css
	rm -rf fonts
	rm -rf js
	rm ./favicon.ico
	rm ./favicon.png
	rm ./index.html