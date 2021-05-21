if [ -z "$GPG_CSC_USERID" -o -z "$GPG_CSC_LINK" -o -z "$GPG_CSC_KEY_PASSWORD" ]; then
  echo "GPG sign skipped"
  exit 0
fi

gpg --batch --import "$GPG_CSC_LINK"

shopt -s extglob

for f in packages/suite-desktop/build-electron/*.@(AppImage|zip|dmg|exe) ; do
  gpg --batch --local-user "$GPG_CSC_USERID" --armor --detach-sig --passphrase "$GPG_CSC_KEY_PASSWORD" --pinentry-mode loopback $f
done
