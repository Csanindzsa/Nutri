import { MacroTable, MacroDetail } from "../interfaces";

export const formatNumber = (num: number) => {
  const decimalPart = (num % 1) * 10;
  if (num == undefined || num == null){
    return "0"
  }
  return decimalPart === 0 ? num.toString() : num.toFixed(1);
};

export const nutrientLabels: Record<string, string> = {
  energy_kcal: "Energy (kcal / kJ)",
  fat: "Fat",
  saturated_fat: "Saturated Fat",
  carbohydrates: "Carbohydrates",
  sugars: "Sugars",
  protein: "Protein",
  fiber: "Fiber",
  salt: "Salt",
};

export const renderTable = (macroTable: MacroTable) => {
  const order = [
    "energy_kcal",
    "fat",
    "saturated_fat",
    "carbohydrates",
    "sugars",
    "protein",
    "fiber",
    "salt",
  ];

  return (
    <table border={1} style={{ width: "100%", marginTop: "10px" }}>
      <thead>
        <tr>
          <th style={{ padding: "5px" }}>Nutrient</th>
          <th style={{ padding: "5px" }}>Per 100g</th>
          <th style={{ padding: "5px" }}>Percentage</th>
        </tr>
      </thead>
      <tbody>
        {order.map((key) => {
          const value = macroTable[key as keyof MacroTable];
          if (value !== undefined) {
            return (
              <tr key={key}>
                <td style={{ fontWeight: "bold", padding: "5px" }}>
                  {nutrientLabels[key] || key}
                </td>
                {key === "energy_kcal" ? (
                  <td colSpan={2} style={{ padding: "5px" }}>
                    {formatNumber(value as number)} kcal / {formatNumber((value as number) * 4.184)} kJ
                  </td>
                ) : (
                  <>
                    <td style={{ padding: "5px" }}>
                      {formatNumber((value as MacroDetail).per100g)}
                    </td>
                    <td style={{ padding: "5px" }}>
                      {formatNumber((value as MacroDetail).percentage)}%
                    </td>
                  </>
                )}
              </tr>
            );
          }
          return null;
        })}
      </tbody>
    </table>
  );
};