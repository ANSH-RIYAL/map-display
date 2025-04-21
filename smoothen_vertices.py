import json
import numpy as np
from copy import deepcopy

def euclidean_distance(p1, p2):
    return np.sqrt((p1[0] - p2[0])**2 + (p1[1] - p2[1])**2)

def should_merge_points(p1, p2, threshold=10):
    return euclidean_distance(p1, p2) < threshold

def should_align_coordinates(v1, v2, threshold=5):
    """Check if two vertices should have their x or y coordinates aligned"""
    x_diff = abs(v1[0] - v2[0])
    y_diff = abs(v1[1] - v2[1])
    
    if x_diff < threshold:
        return 'x', (v1[0] + v2[0]) // 2
    elif y_diff < threshold:
        return 'y', (v1[1] + v2[1]) // 2
    return None, None

def smoothen_polygon(vertices, merge_threshold=10, align_threshold=5):
    if not vertices:
        return vertices
    
    # First pass: merge very close points
    smoothened = [vertices[0]]
    for i in range(1, len(vertices)):
        if not should_merge_points(vertices[i], smoothened[-1], merge_threshold):
            smoothened.append(vertices[i])
    
    # Second pass: align nearly aligned points
    for i in range(len(smoothened)):
        prev_idx = (i - 1) % len(smoothened)
        next_idx = (i + 1) % len(smoothened)
        
        # Check alignment with previous point
        align_type, avg_coord = should_align_coordinates(smoothened[i], smoothened[prev_idx], align_threshold)
        if align_type == 'x':
            smoothened[i][0] = smoothened[prev_idx][0] = avg_coord
        elif align_type == 'y':
            smoothened[i][1] = smoothened[prev_idx][1] = avg_coord
        
        # Check alignment with next point
        align_type, avg_coord = should_align_coordinates(smoothened[i], smoothened[next_idx], align_threshold)
        if align_type == 'x':
            smoothened[i][0] = smoothened[next_idx][0] = avg_coord
        elif align_type == 'y':
            smoothened[i][1] = smoothened[next_idx][1] = avg_coord
    
    return smoothened

def process_vertices(input_file, output_file):
    # Read input vertices
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    # Create a deep copy to modify
    smoothened_data = deepcopy(data)
    
    # Smoothen store boundary
    smoothened_data['store_vertices'] = smoothen_polygon(data['store_vertices'])
    
    # Smoothen internal polygons
    for i, polygon in enumerate(data['polygons']):
        smoothened_data['polygons'][i]['polygon_vertices'] = smoothen_polygon(
            polygon['polygon_vertices']
        )
    
    # Save smoothened vertices
    with open(output_file, 'w') as f:
        json.dump(smoothened_data, f, indent=2)
    
    return smoothened_data

if __name__ == "__main__":
    # Process vertices
    process_vertices('vertices.json', 'smoothened_vertices.json') 