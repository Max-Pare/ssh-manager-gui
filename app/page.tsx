import { AuthGate } from "./_components/ssh-manager/AuthGate";
import { SshManagerApp } from "./_components/ssh-manager/SshManagerApp";

export default function Home() {
  return (
    <AuthGate>
      <SshManagerApp />
    </AuthGate>
  );
}
