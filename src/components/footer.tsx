export default function Footer() {
  return (
    <footer className="flex border-t py-4 mt-8">
      <div className="container flex flex-col items-center justify-center gap-4 md:flex-row">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SaltKids - App
        </p>
      </div>
    </footer>
  );
}
