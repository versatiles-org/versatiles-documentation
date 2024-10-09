
FILE=osm.versatiles
DIRE=/var/www/download.versatiles.org/docs
SIZE=$(stat -Lc %s $DIRE/$FILE)
HASH=$(pv $DIRE/$FILE | openssl dgst -md5 -binary | openssl enc -base64)
echo -e "TsvHttpData-1.0\nhttps://download.versatiles.org/$FILE\t$SIZE\t$HASH\n" > $DIRE/urllist_osm.tsv
