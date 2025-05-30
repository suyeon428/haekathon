from flask import Flask, render_template, request, jsonify
import pandas as pd
import numpy as np
from flask_cors import CORS
from scipy.spatial.distance import euclidean

app = Flask(__name__)
CORS(app)

df = pd.read_csv('professors.csv', encoding='utf-8', skipinitialspace=True)
df.columns = df.columns.str.replace('\n', '').str.strip()

survey_columns = [f'Q{i}' for i in range(1, 17)]
df[survey_columns] = df['성향'].str.split(',', expand=True).fillna(0).astype(int)
df['성향_벡터'] = df[survey_columns].values.tolist()

max_distance = np.linalg.norm(np.array([0]*16) - np.array([3]*16))

def parse_times_block(text):
    if pd.isna(text):
        return []

    lines = text.strip().split('\n')
    result = []

    for line in lines:
        parts = line.strip().split()
        if not parts:
            continue
        day = parts[0]
        times = ",".join(parts[1:]).split(',')
        for t in times:
            t = t.strip()
            if t:
                result.append(f"{day} {t}")
    return result

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/recommend', methods=['POST'])
def recommend():
    data = request.get_json()
    user_vec = np.array(data['answers'])
    available_times = set(data.get('available_times', []))
    user_college = data.get('college')

    df['강의시간_리스트'] = df['강의시간'].apply(parse_times_block)

    df_filtered = df[df['개설대학'] == user_college].copy()

    df_filtered = df_filtered[df_filtered['강의시간_리스트'].apply(lambda times: set(times).issubset(available_times))]

    if df_filtered.empty:
        return jsonify({
            'professor': '조건에 맞는 수업이 없습니다',
            'similarity': 0,
            'top3': [],
            'bottom3': []
        })

    df_filtered['거리'] = df_filtered[survey_columns].apply(
        lambda row: euclidean(user_vec, row.values.astype(float)), axis=1
    )
    df_filtered['유사도'] = df_filtered['거리'].apply(lambda d: round(1 - d / max_distance, 4))

    best_row = df_filtered.nsmallest(1, '거리').iloc[0]
    best_prof = best_row['담당교수']
    best_similarity = round(best_row['유사도'] * 100, 2)

    top3 = df_filtered.nsmallest(3, '거리')[['교과목명', '담당교수', '유사도']]
    bottom3 = df_filtered.nlargest(3, '거리')[['교과목명', '담당교수', '유사도']]

    top_list = [
        {
            'subject': row['교과목명'],
            'professor': row['담당교수'],
            'similarity': round(row['유사도'] * 100, 2)
        } for _, row in top3.iterrows()
    ]
    bottom_list = [
        {
            'subject': row['교과목명'],
            'professor': row['담당교수'],
            'similarity': round(row['유사도'] * 100, 2)
        } for _, row in bottom3.iterrows()
    ]

    return jsonify({
        'professor': best_prof,
        'similarity': best_similarity,
        'top3': top_list,
        'bottom3': bottom_list
    })

if __name__ == '__main__':
    app.run(debug=True)