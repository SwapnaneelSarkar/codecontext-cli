/**
 * DB / API hints from source text (complements AST where available)
 */
export function detectDbAccess(source: string, lang: string): string[] {
  const found = new Set<string>();
  const patterns: [RegExp, string][] = [
    [/prisma\.\w+/gi, 'prisma'],
    [/mongoose\.(model|connect)/gi, 'mongoose'],
    [/sequelize/gi, 'sequelize'],
    [/typeorm/gi, 'typeorm'],
    [/from\s+['"]drizzle-orm/gi, 'drizzle'],
    [/sqlalchemy/gi, 'sqlalchemy'],
    [/session\.(query|add|delete)/gi, 'orm_session'],
    [/database\/sql|database\.sql/gi, 'database/sql'],
    [/SELECT|INSERT|UPDATE|DELETE\s+FROM/gi, 'raw_sql'],
  ];
  if (lang === 'Dart') {
    patterns.push(
      [/FirebaseFirestore|cloud_firestore|FirebaseDatabase/i, 'firebase_firestore'],
      [/FirebaseAuth|firebase_auth/i, 'firebase_auth'],
      [/sqflite|openDatabase\s*\(/i, 'sqflite_sqlite'],
      [/shared_preferences|SharedPreferences/i, 'shared_preferences'],
      [/hive\.|Isar\.|isar|drift\.|moor/i, 'local_db_package'],
      [/secure_storage|FlutterSecureStorage/i, 'secure_storage']
    );
  }
  for (const [re, label] of patterns) {
    if (re.test(source)) found.add(label);
  }
  return [...found];
}

export function detectApiUsage(source: string, lang: string): string[] {
  const found = new Set<string>();
  if (/express|Router\(|app\.(get|post|put|delete|patch|use)/i.test(source)) {
    found.add('express');
  }
  if (/fastapi|@app\.(get|post|put|delete)/i.test(source)) {
    found.add('fastapi');
  }
  if (/flask|@app\.route/i.test(source)) {
    found.add('flask');
  }
  if (/next\/(navigation|headers)/i.test(source) || /export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)/i.test(source)) {
    found.add('next_route');
  }
  if (lang === 'Go' && /http\.HandleFunc|echo\.New|gin\.New|gorilla\.mux/i.test(source)) {
    found.add('go_http');
  }
  if (lang === 'Dart') {
    for (const label of detectDartFlutterContext(source)) {
      found.add(label);
    }
  }
  return [...found];
}

/** Flutter/Dart framework signals merged into FileContext.apiUsage for Dart files. */
export function detectDartFlutterContext(source: string): string[] {
  const labels = new Set<string>();
  if (/extends\s+StatelessWidget\b|StatelessWidget\s*\{/i.test(source)) {
    labels.add('flutter:StatelessWidget');
  }
  if (/extends\s+StatefulWidget\b|StatefulWidget\s*\{/i.test(source)) {
    labels.add('flutter:StatefulWidget');
  }
  if (/\bConsumerWidget\b|\bConsumerStatefulWidget\b/i.test(source)) {
    labels.add('riverpod:ConsumerWidget');
  }
  if (
    /\bProvider\s*[<\(]/i.test(source) ||
    /ChangeNotifierProvider|ListenableProvider|MultiProvider|ProxyProvider/i.test(source)
  ) {
    labels.add('flutter:provider');
  }
  if (/\bref\.watch\s*\(/i.test(source) || /\bWidgetRef\b/i.test(source)) {
    labels.add('riverpod:ref');
  }
  if (/flutter_riverpod|hooks_riverpod/i.test(source)) {
    labels.add('riverpod:package');
  }
  if (/BlocProvider|Cubit\b|BlocBuilder|BlocListener|flutter_bloc/i.test(source)) {
    labels.add('flutter:bloc');
  }
  if (/\bGetx\b|\bGet\.|Obx\s*\(/i.test(source)) {
    labels.add('flutter:getx');
  }
  if (/\bGoRouter\b|package:go_router/i.test(source)) {
    labels.add('flutter:GoRouter');
  }
  if (/Navigator\.pushNamed|MaterialPageRoute/i.test(source)) {
    labels.add('flutter:Navigator');
  }
  if (/http\.(get|post|put|delete|patch)\s*\(/i.test(source)) {
    labels.add('dart:http');
  }
  if (/\bDio\s*\(|\bdio\.\w+|package:dio/i.test(source)) {
    labels.add('dart:dio');
  }
  if (
    (/\.fromJson|factory\s+\w+\.fromJson/i.test(source) && /toJson\s*\(/i.test(source))
  ) {
    labels.add('dart:json_model');
  }
  return [...labels];
}
