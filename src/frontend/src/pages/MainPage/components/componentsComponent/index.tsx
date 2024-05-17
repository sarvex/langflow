import { cloneDeep } from "lodash";
import { useEffect, useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CollectionCardComponent from "../../../../components/cardComponent";
import CardsWrapComponent from "../../../../components/cardsWrapComponent";
import IconComponent from "../../../../components/genericIconComponent";
import PaginatorComponent from "../../../../components/paginatorComponent";
import { SkeletonCardComponent } from "../../../../components/skeletonCardComponent";
import { Button } from "../../../../components/ui/button";
import { multipleDeleteFlowsComponents } from "../../../../controllers/API";
import DeleteConfirmationModal from "../../../../modals/deleteConfirmationModal";
import useAlertStore from "../../../../stores/alertStore";
import useFlowsManagerStore from "../../../../stores/flowsManagerStore";
import { useFolderStore } from "../../../../stores/foldersStore";
import { FlowType } from "../../../../types/flow";
import useFileDrop from "../../hooks/use-on-file-drop";
import { sortFlows } from "../../utils/sort-flows";
import EmptyComponent from "../emptyComponent";
import HeaderComponent from "../headerComponent";

export default function ComponentsComponent({
  is_component = true,
}: {
  is_component?: boolean;
}) {
  const uploadFlow = useFlowsManagerStore((state) => state.uploadFlow);
  const removeFlow = useFlowsManagerStore((state) => state.removeFlow);
  const isLoading = useFlowsManagerStore((state) => state.isLoading);
  const setAllFlows = useFlowsManagerStore((state) => state.setAllFlows);
  const allFlows = useFlowsManagerStore((state) => state.allFlows);

  const flowsFromFolder = useFolderStore(
    (state) => state.selectedFolder?.flows,
  );

  const setSuccessData = useAlertStore((state) => state.setSuccessData);
  const setErrorData = useAlertStore((state) => state.setErrorData);
  const [openDelete, setOpenDelete] = useState(false);
  const searchFlowsComponents = useFlowsManagerStore(
    (state) => state.searchFlowsComponents,
  );

  const setSelectedFlowsComponentsCards = useFlowsManagerStore(
    (state) => state.setSelectedFlowsComponentsCards,
  );

  const selectedFlowsComponentsCards = useFlowsManagerStore(
    (state) => state.selectedFlowsComponentsCards,
  );

  const [handleFileDrop] = useFileDrop(uploadFlow, is_component);
  const [pageSize, setPageSize] = useState(20);
  const [pageIndex, setPageIndex] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();
  const all: FlowType[] = sortFlows(allFlows, is_component);
  const start = (pageIndex - 1) * pageSize;
  const end = start + pageSize;
  const data: FlowType[] = all?.slice(start, end);
  const name = is_component ? "Component" : "Flow";

  const folderId = location?.state?.folderId;
  const getFolderById = useFolderStore((state) => state.getFolderById);
  const myCollectionId = useFolderStore((state) => state.myCollectionId);
  const getFoldersApi = useFolderStore((state) => state.getFoldersApi);
  const setFolderUrl = useFolderStore((state) => state.setFolderUrl);

  useEffect(() => {
    setFolderUrl(folderId ?? "");
    setSelectedFlowsComponentsCards([]);
    handleSelectAll(false);
    getFolderById(folderId ? folderId : myCollectionId);
  }, [location]);

  useEffect(() => {
    const newFlows = cloneDeep(flowsFromFolder!);
    const filteredFlows = newFlows?.filter(
      (f) =>
        f.name.toLowerCase().includes(searchFlowsComponents.toLowerCase()) ||
        f.description
          .toLowerCase()
          .includes(searchFlowsComponents.toLowerCase()),
    );

    if (searchFlowsComponents === "") {
      setAllFlows(flowsFromFolder!);
    }

    setAllFlows(filteredFlows);
  }, [searchFlowsComponents]);

  const resetFilter = () => {
    setPageIndex(1);
    setPageSize(20);
  };

  const { getValues, control, setValue } = useForm();
  const entireFormValues = useWatch({ control });

  const methods = useForm();
  const handleSelectAll = (select) => {
    const flowsFromFolderIds = flowsFromFolder?.map((f) => f.id);
    if (select) {
      Object.keys(getValues()).forEach((key) => {
        if (!flowsFromFolderIds?.includes(key)) return;
        setValue(key, true);
      });
      return;
    }

    Object.keys(getValues()).forEach((key) => {
      setValue(key, false);
    });
  };

  const handleSelectOptionsChange = () => {
    const hasSelected = selectedFlowsComponentsCards?.length > 0;
    if (!hasSelected) {
      setErrorData({
        title: "No items selected",
        list: ["Please select items to delete"],
      });
      return;
    }
    setOpenDelete(true);
  };

  const handleDelete = (item) => {
    removeFlow(item.id);
    setSuccessData({
      title: `${
        item.is_component ? "Component" : "Flow"
      } deleted successfully!`,
    });
    resetFilter();
    getFoldersApi(true);
  };

  const handleDeleteMultiple = () => {
    multipleDeleteFlowsComponents(selectedFlowsComponentsCards).then(
      () => {
        resetFilter();
        getFoldersApi(true);
        setSuccessData({
          title: "Selected items deleted successfully!",
        });
      },
      () => {
        setErrorData({
          title: "Error deleting items",
          list: ["Please try again"],
        });
      },
    );
  };

  useEffect(() => {
    if (!entireFormValues || Object.keys(entireFormValues).length === 0) return;
    const selectedFlows: string[] = Object.keys(entireFormValues).filter(
      (key) => {
        if (entireFormValues[key] === true) {
          return true;
        }
        return false;
      },
    );

    setSelectedFlowsComponentsCards(selectedFlows);
  }, [entireFormValues]);

  const getDescriptionModal = useMemo(() => {
    if (selectedFlowsComponentsCards?.length === 1) {
      return ` ${is_component ? "component" : "flow"}`;
    }
    return ` ${is_component ? "components" : "flows"}`;
  }, [selectedFlowsComponentsCards]);

  return (
    <>
      {allFlows?.length > 0 && (
        <HeaderComponent
          handleDelete={handleSelectOptionsChange}
          handleSelectAll={handleSelectAll}
          disableDelete={!selectedFlowsComponentsCards?.length > 0}
        />
      )}

      <CardsWrapComponent
        onFileDrop={handleFileDrop}
        dragMessage={`Drag your ${name} here`}
      >
        <div className="flex h-full w-full flex-col justify-between">
          <div className="flex w-full flex-col gap-4">
            {!isLoading && data?.length === 0 ? (
              <EmptyComponent />
            ) : (
              <div className="grid w-full gap-4 md:grid-cols-2 lg:grid-cols-2">
                {isLoading === false && data?.length > 0 ? (
                  <>
                    {data?.map((item) => (
                      <FormProvider {...methods} key={item.id}>
                        <form>
                          <CollectionCardComponent
                            is_component={is_component}
                            onDelete={() => handleDelete(item)}
                            data={{
                              is_component: item.is_component ?? false,
                              ...item,
                            }}
                            disabled={isLoading}
                            data-testid={"edit-flow-button-" + item.id}
                            button={
                              !is_component ? (
                                <Link to={"/flow/" + item.id}>
                                  <Button
                                    tabIndex={-1}
                                    variant="outline"
                                    size="sm"
                                    className="whitespace-nowrap"
                                    data-testid={"edit-flow-button-" + item.id}
                                  >
                                    <IconComponent
                                      name="ExternalLink"
                                      className="main-page-nav-button select-none"
                                    />
                                    Edit Flow
                                  </Button>
                                </Link>
                              ) : (
                                <></>
                              )
                            }
                            onClick={
                              !is_component
                                ? () => {
                                    navigate("/flow/" + item.id);
                                  }
                                : undefined
                            }
                            playground={!is_component}
                            control={control}
                          />
                        </form>
                      </FormProvider>
                    ))}
                  </>
                ) : (
                  <>
                    <SkeletonCardComponent />
                    <SkeletonCardComponent />
                  </>
                )}
              </div>
            )}
          </div>
          {!isLoading && data?.length > 0 && (
            <div className="relative py-6">
              <PaginatorComponent
                storeComponent={true}
                pageIndex={pageIndex}
                pageSize={pageSize}
                rowsCount={[10, 20, 50, 100]}
                totalRowsCount={
                  allFlows?.filter(
                    (f) => (f.is_component ?? false) === is_component,
                  )?.length
                }
                paginate={(pageSize, pageIndex) => {
                  setPageIndex(pageIndex);
                  setPageSize(pageSize);
                }}
              ></PaginatorComponent>
            </div>
          )}
        </div>
      </CardsWrapComponent>
      {openDelete && (
        <DeleteConfirmationModal
          open={openDelete}
          setOpen={setOpenDelete}
          onConfirm={handleDeleteMultiple}
          description={getDescriptionModal}
        >
          <></>
        </DeleteConfirmationModal>
      )}
    </>
  );
}
