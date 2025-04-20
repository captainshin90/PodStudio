import { useState } from "react";
import { Model } from "@/lib/schemas/models";
import ModelBrowser from "@/components/models/ModelBrowser";
import ModelDetails from "@/components/models/ModelDetails";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { modelsService } from "@/lib/services/database-service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

//////////////////////////////////////////////////////////////////////////////
// models page component
//////////////////////////////////////////////////////////////////////////////  
export default function ModelsPage() {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [showNewModel, setShowNewModel] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  //////////////////////////////////////////////////////////////////////////////
  // handle the save model
  //////////////////////////////////////////////////////////////////////////////
  const handleSave = async (updatedModel: Model) => {
    try {
      await modelsService.updateModel(updatedModel.id, updatedModel);
      toast({
        title: "Success",
        description: "Model updated successfully",
      });
      setSelectedModel(updatedModel);
    } catch (error) {
      console.error("Error updating model:", error);
      toast({
        title: "Error",
        description: "Failed to update model",
        variant: "destructive",
      });
    }
  };

  //////////////////////////////////////////////////////////////////////////////
  // handle the create model
  //////////////////////////////////////////////////////////////////////////////
  const handleCreate = async (newModel: Model) => {
    try {
      await modelsService.createModel(newModel.id, newModel);
      toast({
        title: "Success",
        description: "Model created successfully",
      });
      setShowNewModel(false);
    } catch (error) {
      console.error("Error creating model:", error);
      toast({
        title: "Error",
        description: "Failed to create model",
        variant: "destructive",
      });
    }
  };

  //////////////////////////////////////////////////////////////////////////////
  // handle the delete model
  //////////////////////////////////////////////////////////////////////////////
  const handleDelete = async () => {
    if (!selectedModel?.id) return;
    
    try {
      await modelsService.deleteModel(selectedModel.id);
      toast({
        title: "Success",
        description: "Model deleted successfully",
      });
      setSelectedModel(null);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting model:", error);
      toast({
        title: "Error",
        description: "Failed to delete model",
        variant: "destructive",
      });
    }
  };

  //////////////////////////////////////////////////////////////////////////////
  // return the models page component
  //////////////////////////////////////////////////////////////////////////////
  return (
    <div className="container mx-auto py-0 px-0">
      <h1 className="text-2xl font-bold text-muted-foreground mb-6">Models Management</h1>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Model List */}
        <div className="col-span-4 border rounded-lg p-4">
          <ModelBrowser 
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            disabled={showNewModel}
          />
        </div>

        {/* Right Panel - Model Details or New Model */}
        <div className="col-span-8 border rounded-lg p-4">
          {showNewModel ? (
            <div className="space-y-4">
              <ModelDetails
                model={null}
                onSave={handleCreate}
                onCancel={() => setShowNewModel(false)}
                isNew={true}
              />
            </div>
          ) : (
            <>
              {!selectedModel && (
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setShowNewModel(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Model
                  </Button>
                </div>
              )}
              <ModelDetails
                model={selectedModel}
                onSave={handleSave}
                onDelete={() => setShowDeleteDialog(true)}
                onCancel={() => setSelectedModel(null)}
                isNew={false}
              />
            </>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will delete the model
              "{selectedModel?.model_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 