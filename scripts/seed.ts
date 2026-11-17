// Force a fresh demo world: `npm run db:seed`
import { resetDemoData } from "../src/lib/seed";

resetDemoData()
  .then((r) => {
    console.log("Demo data reset:", r);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
