OUTFILE = out.user.js

all:
	rollup -c rollup.config.js -o $(OUTFILE) && eslint --fix $(OUTFILE)
