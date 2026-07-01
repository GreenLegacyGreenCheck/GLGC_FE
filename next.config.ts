import type { NextConfig } from "next";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { version } = require("./package.json") as { version: string };

const nextConfig: NextConfig = {
  env: {
    // package.json의 version을 빌드 시 번들에 자동 주입한다.
    // 새 기능을 배포할 때 package.json의 version만 올리면
    // appUpdate 알림이 자동으로 트리거된다.
    NEXT_PUBLIC_APP_VERSION: version,
  },
};

export default nextConfig;
