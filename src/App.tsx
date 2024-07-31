import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { InputSelect } from "./components/InputSelect";
import { Instructions } from "./components/Instructions";
import { Transactions } from "./components/Transactions";
import { useEmployees } from "./hooks/useEmployees";
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions";
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee";
import { EMPTY_EMPLOYEE } from "./utils/constants";
import { Employee } from "./utils/types";

export function App() {
  const { data: employees, loading: employeesLoading, fetchAll: fetchEmployees } = useEmployees();
  const { data: paginatedTransactions, fetchAll: fetchPaginatedTransactions } = usePaginatedTransactions();
  const { data: transactionsByEmployee, fetchById: fetchTransactionsByEmployee } = useTransactionsByEmployee();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [hasMoreData, setHasMoreData] = useState(true);

  const transactions = useMemo(() => {
    if (selectedEmployee) {
      return transactionsByEmployee;
    }
    return paginatedTransactions?.data ?? [];
  }, [paginatedTransactions, transactionsByEmployee, selectedEmployee]);

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true);
    await fetchEmployees();
    await fetchPaginatedTransactions();
    setIsLoading(false);
  }, [fetchEmployees, fetchPaginatedTransactions]);

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      setIsLoading(true);
      setSelectedEmployee(employees?.find((emp) => emp.id === employeeId) ?? null);
      await fetchTransactionsByEmployee(employeeId);
      setIsLoading(false);
    },
    [fetchTransactionsByEmployee, employees]
  );

  const loadMoreTransactions = useCallback(async () => {
    setIsLoading(true);
    if (selectedEmployee === null) {
      await fetchPaginatedTransactions();
    } else {
      await fetchTransactionsByEmployee(selectedEmployee.id);
    }
    setIsLoading(false);
  }, [fetchPaginatedTransactions, fetchTransactionsByEmployee, selectedEmployee]);

  const resetFilter = useCallback(async () => {
    setSelectedEmployee(null);
    await loadAllTransactions();
  }, [loadAllTransactions]);

  useEffect(() => {
    if (employees === null && !employeesLoading) {
      loadAllTransactions();
    }
  }, [employeesLoading, employees, loadAllTransactions]);

  useEffect(() => {
    if (paginatedTransactions?.nextPage === null) {
      setHasMoreData(false);
    }
  }, [paginatedTransactions]);

  const showViewMoreButton = useMemo(() => {
    return paginatedTransactions?.data !== null && selectedEmployee === null && hasMoreData;
  }, [paginatedTransactions, selectedEmployee, hasMoreData]);

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={employeesLoading || isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null) {
              return;
            }

            if (newValue.id === EMPTY_EMPLOYEE.id) {
              await resetFilter(); 
            } else {
              await loadTransactionsByEmployee(newValue.id); 
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {showViewMoreButton && (
            <button
              className="RampButton"
              disabled={isLoading}
              onClick={async () => {
                await loadMoreTransactions();
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  );
}
