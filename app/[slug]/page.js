import ListProduk from "../../components/client/ListProduk";

export default async function Page({ params }) {
  const resolvedParams = await params;
  const category = typeof resolvedParams?.slug === "string" ? resolvedParams.slug : "";
  return <ListProduk category={category} />;
}
