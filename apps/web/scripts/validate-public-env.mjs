const forbidden = /(secret|password|database|private|token|credential|key)/i;
const exposed = Object.keys(process.env).filter(
  (name) => name.startsWith('NEXT_PUBLIC_') && forbidden.test(name),
);

if (exposed.length) {
  throw new Error(
    `Potentially private frontend variables are forbidden: ${exposed.join(', ')}`,
  );
}
