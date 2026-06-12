import { AdvisoryForm } from "./_components/AdvisoryForm";

export default function AdvisoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Crop Advisory</h1>
        <p className="text-muted-foreground">
          Get AI-powered advice for your crop health, pest management, and growing decisions.
        </p>
      </div>
      <AdvisoryForm />
    </div>
  );
}
