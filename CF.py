# ========== NeuMF Model ========== 
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

torch.manual_seed(42)
np.random.seed(42)

class NeuMF(nn.Module):
    def __init__(self, num_users, num_items, embedding_size, hidden_layer_size):
        super(NeuMF, self).__init__()
        self.pu_gmf = nn.Embedding(num_users, embedding_size)
        self.pu_mlp = nn.Embedding(num_users, embedding_size)
        self.qi_gmf = nn.Embedding(num_items, embedding_size)
        self.qi_mlp = nn.Embedding(num_items, embedding_size)
        self.mlp = nn.Sequential(
            nn.Linear(2 * embedding_size, hidden_layer_size[0]),
            nn.Linear(hidden_layer_size[0], hidden_layer_size[1]),
            nn.Linear(hidden_layer_size[1], hidden_layer_size[2])
        )
        self.neumf_final_layer = nn.Linear(int(embedding_size + (embedding_size/2)), 1, bias=False)

    def forward(self, user_input, item_input):
        pu_gmf_input = self.pu_gmf(user_input)
        qi_gmf_input = self.qi_gmf(item_input)
        pu_mlp_input = self.pu_mlp(user_input)
        qi_mlp_input = self.qi_mlp(item_input)
        gmf_output = torch.mul(pu_gmf_input, qi_gmf_input)
        mlp_input = torch.cat([pu_mlp_input, qi_mlp_input], dim=1)
        layer_1_output = self.mlp[0](mlp_input)
        layer_1_output = torch.relu(layer_1_output)
        layer_2_output = self.mlp[1](layer_1_output)
        layer_2_output = torch.relu(layer_2_output)
        layer_3_output = self.mlp[2](layer_2_output)
        layer_3_output = torch.relu(layer_3_output)
        combined_gmf_mlp = torch.cat([gmf_output, layer_3_output], dim=1)
        final_layer_output = self.neumf_final_layer(combined_gmf_mlp)
        prediction = torch.sigmoid(final_layer_output)
        return prediction

    def predict(self, id_user, user2user_encoded, item_encoded2item):
        id_user_cf = user2user_encoded.get(id_user)
        user_tensor = torch.tensor([id_user_cf])
        pu_gmf_input = self.pu_gmf(user_tensor)
        pu_mlp_input = self.pu_mlp(user_tensor)
        predictions = {}
        for id_item_cf in range(self.qi_gmf.num_embeddings):
            id_item = item_encoded2item.get(id_item_cf)
            item_tensor = torch.tensor([id_item_cf])
            qi_gmf_input = self.qi_gmf(item_tensor)
            qi_mlp_input = self.qi_mlp(item_tensor)
            gmf_output = torch.mul(pu_gmf_input, qi_gmf_input)
            mlp_input = torch.cat([pu_mlp_input, qi_mlp_input], dim=1)
            layer_1_output = self.mlp[0](mlp_input)
            layer_1_output = torch.relu(layer_1_output)
            layer_2_output = self.mlp[1](layer_1_output)
            layer_2_output = torch.relu(layer_2_output)
            layer_3_output = self.mlp[2](layer_2_output)
            layer_3_output = torch.relu(layer_3_output)
            combined_gmf_mlp = torch.cat([gmf_output, layer_3_output], dim=1)
            final_layer_output = self.neumf_final_layer(combined_gmf_mlp)
            prediction = torch.sigmoid(final_layer_output)
            predictions[id_item] = float(round(prediction.item(), 4))
        predictions = dict(sorted(predictions.items()))
        return predictions

# ========== Predicted rating ==========
def predicted_rating_items(id_user_row, neumf_model_new, user2user_encoded, item_encoded2item):
    predicted = neumf_model_new.predict(id_user_row, user2user_encoded, item_encoded2item)
    predicted_items = []
    for id_item, predicted_rating in predicted.items():
        predicted_items.append({
            'id_item': id_item,
            'predicted_rating': predicted_rating
        })
    return predicted_items