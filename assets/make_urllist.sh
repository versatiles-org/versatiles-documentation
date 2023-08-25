# run me in /var/www/download.versatiles.org/docs

echo -e "TsvHttpData-1.0\nhttps://download.versatiles.org/planet-20230605.versatiles\t$(stat -c %s planet-20230605.versatiles)\t$(pv planet-20230605.versatiles | openssl dgst -md5 -binary | openssl enc -base64)\n" > urllist.tsv
