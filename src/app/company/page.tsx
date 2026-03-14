import { getCompanyOKRTree } from "@/app/actions";
import { CompanyTree } from "@/components/company-tree";
import { Network } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CompanyPage() {
  const tree = await getCompanyOKRTree();
  function countTree(nodes: any[]): { objs: number; krs: number } {
    let objs = 0, krs = 0;
    for (const n of nodes) { objs++; krs += n.keyResults?.length || 0; if (n.childObjectives) { const s = countTree(n.childObjectives); objs += s.objs; krs += s.krs; } }
    return { objs, krs };
  }
  const t = countTree(tree);

  return (
    <div className="p-5 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-10">
        <p className="text-sm text-gray-400 font-medium mb-1">Прозорість &middot; Вся компанія</p>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <Network className="w-9 h-9 text-[#6c5ce7]" />OKR компанії
        </h1>
        <p className="text-base text-gray-400 mt-2 max-w-2xl">
          Кожен бачить цілі кожного — від CEO до кожного спеціаліста. Натисніть на картку щоб розгорнути KR.
        </p>
        <div className="flex gap-6 mt-4 text-sm text-gray-400">
          <span><strong className="text-gray-700">{t.objs}</strong> цілей</span>
          <span><strong className="text-gray-700">{t.krs}</strong> ключових результатів</span>
        </div>
      </div>
      <CompanyTree tree={tree} />
    </div>
  );
}
