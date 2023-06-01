{ pkgs }: {
    deps = [
        pkgs.yarn
        pkgs.esbuild
        pkgs.vim
        pkgs.nodejs-18_x

        pkgs.nodePackages.typescript
        pkgs.nodePackages.typescript-language-server
        pkgs.openssl_1_1
	];
  env = { LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [ pkgs.openssl_1_1.out ]; };
}